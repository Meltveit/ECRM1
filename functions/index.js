// functions/index.js
/* eslint-disable @typescript-eslint/no-var-requires */
const functions = require('firebase-functions/v1'); // Use v1 for https.onCall
const admin = require('firebase-admin');
admin.initializeApp();
const stripe = require('stripe')(functions.config().stripe.secret_key);

const PRICE_PER_MEMBER_EUR_CENTS = 699; // €6.99 in cents
const PRICE_ID = functions.config().stripe.price_id || "YOUR_STRIPE_PRICE_ID"; // Get from Firebase config or hardcode for testing
const SUCCESS_URL = functions.config().stripe.success_url || 'http://localhost:9002/users?success=true'; // Use default or config
const CANCEL_URL = functions.config().stripe.cancel_url || 'http://localhost:9002/users?cancelled=true'; // Use default or config

// --- Create Stripe Checkout Session ---
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const teamId = data.teamId;
    const quantity = data.quantity; // Number of members

    if (!teamId) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "teamId".');
    }
    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a positive "quantity".');
    }

    try {
        // Get the team document to find the adminId
        const teamDocRef = admin.firestore().collection('teams').doc(teamId);
        const teamDoc = await teamDocRef.get();
        if (!teamDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Team not found.');
        }
        const teamData = teamDoc.data();
        const adminId = teamData.adminId; // The UID of the admin user paying
        const stripeCustomerId = teamData.stripeCustomerId; // Get existing Stripe Customer ID if available

        if (!adminId) {
             throw new functions.https.HttpsError('failed-precondition', 'Team does not have an admin assigned.');
        }

        // Ensure the caller is the admin of the team
        if (context.auth.uid !== adminId) {
             throw new functions.https.HttpsError('permission-denied', 'Only the team admin can create a checkout session.');
        }

        // Calculate total price (more for display/info, Stripe uses quantity * unit_price)
        const totalPriceCents = PRICE_PER_MEMBER_EUR_CENTS * quantity;
        const totalPriceEUR = (totalPriceCents / 100).toFixed(2);

        // Create checkout session options
        const sessionOptions = {
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{
                price: PRICE_ID, // Price ID for your €6.99/member plan
                quantity: quantity,
            }],
            success_url: `${SUCCESS_URL}&session_id={CHECKOUT_SESSION_ID}`, // Include session ID for verification if needed
            cancel_url: CANCEL_URL,
            metadata: {
                teamId: teamId,
                adminId: adminId, // Store admin ID in metadata
                // You can add other relevant metadata
            },
            // Link to existing Stripe Customer if available
            ...(stripeCustomerId && { customer: stripeCustomerId }),
             // If no customer ID, Stripe creates one. We can also pre-create or retrieve email here.
             ...(!stripeCustomerId && teamData.adminEmail && { customer_email: teamData.adminEmail })
        };

        // Create the Stripe Checkout session
        const session = await stripe.checkout.sessions.create(sessionOptions);

        // Return the session ID and calculated price (for display)
        return { sessionId: session.id, price: totalPriceEUR };

    } catch (error) {
        console.error('Error creating checkout session for team:', teamId, error);
        // Provide a more generic error message to the client
        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw specific HTTPS errors
        }
        throw new functions.https.HttpsError('internal', 'Failed to create checkout session.');
    }
});


// --- Create Stripe Portal Link ---
exports.createPortalLink = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const customerId = data.customerId; // Stripe Customer ID passed from client

    if (!customerId) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "customerId".');
    }

    // Optional: Verify the user calling is the owner/admin associated with this customerId
    // This might involve looking up the team by customerId or checking against user's custom claims
    // For simplicity, we assume the client-side logic already verified admin status

    try {
        const link = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: SUCCESS_URL, // Redirect back to the users/billing page after portal session
        });

        return { url: link.url };

    } catch (error) {
        console.error('Error creating Stripe portal link for customer:', customerId, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to create portal link.');
    }
});


// --- Firestore Trigger: Handle Stripe Subscription Creation/Update ---
// This function assumes you have the Stripe Firebase Extension installed
// and it writes subscription data to a 'customers/{uid}/subscriptions' collection.
// We listen to that collection for changes.

exports.onSubscriptionWrite = functions.firestore
  .document('customers/{userId}/subscriptions/{subscriptionId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId; // This is the Firebase Auth UID (should be the admin's UID)
    const subscriptionData = change.after.exists ? change.after.data() : null;
    const previousSubscriptionData = change.before.exists ? change.before.data() : null;


    // If subscription is deleted or doesn't exist after write, handle cancellation/cleanup
    if (!subscriptionData) {
        console.log(`Subscription ${context.params.subscriptionId} deleted for user ${userId}. Handling potential downgrade.`);
        // Find the team where this user is the admin
        const teamsRef = admin.firestore().collection('teams');
        const teamQuery = query(teamsRef, where('adminId', '==', userId));
        const teamSnapshot = await teamQuery.get();

        if (teamSnapshot.empty) {
            console.log(`No team found with adminId ${userId}. Skipping downgrade.`);
            return null;
        }

        // Assuming admin only belongs to one team they pay for
        const teamDoc = teamSnapshot.docs[0];
         // Check if the deleted subscription matches the team's active one
         if (teamDoc.data().stripeSubscriptionId === context.params.subscriptionId) {
            console.log(`Downgrading team ${teamDoc.id} to free plan.`);
            await teamDoc.ref.update({
                planType: 'free',
                subscriptionStatus: 'canceled', // Or 'inactive' depending on desired state
                stripeSubscriptionId: null, // Clear the subscription ID
                 updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
         } else {
             console.log(`Deleted subscription ${context.params.subscriptionId} does not match active subscription ${teamDoc.data().stripeSubscriptionId} for team ${teamDoc.id}. Skipping downgrade.`);
         }

        return null;
    }

    // --- Handle Subscription Creation or Update ---

    const teamId = subscriptionData.metadata?.teamId;
    const stripeCustomerId = subscriptionData.customer; // Get Stripe Customer ID from subscription
    const stripeSubscriptionId = subscriptionData.id; // The ID of the Stripe subscription itself
    const status = subscriptionData.status; // e.g., 'active', 'trialing', 'past_due', 'canceled'

    if (!teamId) {
        console.warn(`Subscription ${stripeSubscriptionId} for user ${userId} is missing teamId in metadata. Cannot update team.`);
        // Optionally: Attempt to find the team via adminId if metadata is missing
        return null;
    }

    try {
        const teamDocRef = admin.firestore().collection('teams').doc(teamId);
        const teamDoc = await teamDocRef.get();

        if (!teamDoc.exists) {
            console.error(`Team ${teamId} not found for subscription ${stripeSubscriptionId}.`);
            return null;
        }

        // Ensure the userId from the path matches the team's adminId
        if (teamDoc.data().adminId !== userId) {
             console.error(`Mismatch: User ${userId} is not the admin (${teamDoc.data().adminId}) of team ${teamId}. Subscription update skipped.`);
             return null;
        }


        // Determine the plan type based on status
        let planType = teamDoc.data().planType; // Keep existing plan unless changed
        if (status === 'active' || status === 'trialing') {
            planType = 'premium';
        } else if (status === 'canceled' || status === 'incomplete_expired' || status === 'unpaid') {
            planType = 'free'; // Downgrade on cancellation or failure
        }

        // Prepare update data
        const updateData = {
            stripeCustomerId: stripeCustomerId, // Store/update Stripe customer ID
            stripeSubscriptionId: stripeSubscriptionId, // Store/update Stripe subscription ID
            subscriptionStatus: status,
            planType: planType,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

         // Only update if there are actual changes to avoid unnecessary writes
        const currentData = teamDoc.data();
        const hasChanged = Object.keys(updateData).some(key => updateData[key] !== currentData[key]);

        if (hasChanged) {
           console.log(`Updating team ${teamId} with subscription status: ${status}, plan: ${planType}`);
           await teamDocRef.update(updateData);
        } else {
            console.log(`No changes detected for team ${teamId}. Skipping update.`);
        }


    } catch (error) {
        console.error(`Error updating team ${teamId} from subscription ${stripeSubscriptionId}:`, error);
        // Consider adding retry logic or error reporting
    }

    return null;
});

// --- Cloud Function to Update Stripe Subscription Quantity ---
exports.updateSubscriptionQuantity = functions.https.onCall(async (data, context) => {
     // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const teamId = data.teamId;
    const newQuantity = data.quantity;

    if (!teamId || !newQuantity || typeof newQuantity !== 'number' || newQuantity <= 0) {
         throw new functions.https.HttpsError('invalid-argument', 'Requires "teamId" and positive "quantity".');
    }

    try {
        // Get team data
        const teamDocRef = admin.firestore().collection('teams').doc(teamId);
        const teamDoc = await teamDocRef.get();
        if (!teamDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Team not found.');
        }
        const teamData = teamDoc.data();
        const adminId = teamData.adminId;
        const stripeSubscriptionId = teamData.stripeSubscriptionId;

        // Verify caller is the admin
        if (context.auth.uid !== adminId) {
            throw new functions.https.HttpsError('permission-denied', 'Only the team admin can update the subscription.');
        }

        if (!stripeSubscriptionId) {
             throw new functions.https.HttpsError('failed-precondition', 'Team does not have an active Stripe subscription ID.');
        }

        // Retrieve the subscription from Stripe to find the item ID
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
         if (!subscription || !subscription.items || subscription.items.data.length === 0) {
             throw new functions.https.HttpsError('not-found', 'Stripe subscription item not found.');
         }
         const subscriptionItemId = subscription.items.data[0].id; // Assuming one item per subscription

         // Update the subscription item quantity in Stripe
         await stripe.subscriptionItems.update(subscriptionItemId, {
             quantity: newQuantity,
         });

        console.log(`Successfully updated quantity for subscription ${stripeSubscriptionId} to ${newQuantity}`);
        return { success: true, newQuantity: newQuantity };

    } catch (error) {
        console.error('Error updating subscription quantity for team:', teamId, error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
         // Handle potential Stripe errors (e.g., subscription not found)
         if (error.code === 'resource_missing') {
             throw new functions.https.HttpsError('not-found', 'Stripe subscription not found.');
         }
        throw new functions.https.HttpsError('internal', 'Failed to update subscription quantity.');
    }
});
```