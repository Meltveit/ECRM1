// src/app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, BarChart3, Users, Calendar, Target } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';

export default function LandingPage() {
  return (
    // Removed min-h-screen flex flex-col from root div, let children handle height
    <div>
      {/* Navigation */}
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-semibold text-lg text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>ECRM</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-700 hover:text-primary transition">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-700 hover:text-primary transition">Pricing</Link>
            <Link href="#testimonials" className="text-sm font-medium text-gray-700 hover:text-primary transition">Testimonials</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-primary transition">Login</Link>
            <Link href="/register" passHref>
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-secondary/20">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center"> {/* Increased gap */}
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                Simplified CRM for Growing Businesses
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Manage your customers, track activities, and boost sales with our intuitive CRM solution designed for small to medium businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" passHref>
                  <Button size="lg" className="gap-2">
                    Start for Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#demo" passHref>
                  <Button variant="outline" size="lg">See how it works</Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-lg shadow-xl p-4 border">
                <ImageWithFallback
                  src="/dashboard-preview.png"
                  fallbackSrc="https://picsum.photos/600/400?random=1"
                  alt="ECRM Dashboard Preview"
                  className="rounded-md w-full h-auto"
                  width={600}
                  height={400}
                  data-ai-hint="dashboard preview"
                  priority // Prioritize loading the hero image
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything You Need to Manage Your Customer Relationships</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our platform combines ease of use with powerful features to help you stay on top of your business relationships.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-secondary/10 rounded-lg p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Contact Management</h3>
                <p className="text-gray-600">Keep all your client information organized and accessible in one place.</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-secondary/10 rounded-lg p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Activity Tracking</h3>
                <p className="text-gray-600">Log calls, meetings, and emails to keep a complete history of all client interactions.</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-secondary/10 rounded-lg p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Task Management</h3>
                <p className="text-gray-600">Set reminders and prioritize your work to never miss an important follow-up.</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-secondary/10 rounded-lg p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Reporting & Analytics</h3>
                <p className="text-gray-600">Gain insights into your sales pipeline and team performance with visual reports.</p>
              </div>

              {/* Feature 5 */}
              <div className="bg-secondary/10 rounded-lg p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                   {/* Using the CRM icon directly */}
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                   </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
                <p className="text-gray-600">Work together with your team members, sharing client information securely.</p>
              </div>

              {/* Feature 6 */}
              <div className="bg-secondary/10 rounded-lg p-6">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Suggestions</h3>
                <p className="text-gray-600">Get intelligent recommendations for your next client interaction based on your history.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose the plan that works for your business. No hidden fees, no surprises.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-bold mb-2">Free</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">$0</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Perfect for individuals or very small teams.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Up to 50 clients</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Basic contact management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Activity logging</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>1 user</span>
                  </div>
                </div>
                <div className="p-6">
                  <Link href="/register" passHref>
                    <Button variant="outline" className="w-full">Get Started</Button>
                  </Link>
                </div>
              </div>

              {/* Premium Plan */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary relative transform md:scale-105 z-10">
                <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-bold rounded-bl">Popular</div>
                <div className="p-6 border-b">
                  <h3 className="text-xl font-bold mb-2">Premium</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">€6.99</span>
                    <span className="text-gray-500">/user/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Best for growing businesses.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Up to 1,000 clients</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Advanced contact management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Activity & task management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Unlimited team members</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>AI-powered suggestions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Basic analytics & reporting</span>
                  </div>
                </div>
                <div className="p-6">
                  <Link href="/register?plan=premium" passHref>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">Custom</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">For large organizations with custom needs.</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Unlimited clients</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>All Premium features</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Dedicated support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Custom integrations</span>
                  </div>
                </div>
                <div className="p-6">
                  <Link href="/contact" passHref>
                    <Button variant="outline" className="w-full">Contact Sales</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Businesses of all sizes trust ECRM to manage their customer relationships.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-secondary/10 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-primary">
                    JS
                  </div>
                  <div>
                    <h4 className="font-semibold">John Smith</h4>
                    <p className="text-sm text-gray-600">Small Business Owner</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "ECRM has transformed how we manage our client relationships. The interface is intuitive and our team was able to start using it right away without extensive training."
                </p>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-secondary/10 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-primary">
                    MJ
                  </div>
                  <div>
                    <h4 className="font-semibold">Maria Johnson</h4>
                    <p className="text-sm text-gray-600">Sales Director</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "The activity tracking and AI suggestions have significantly improved our follow-up process. We're closing more deals and our clients feel better cared for."
                </p>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-secondary/10 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-primary">
                    RB
                  </div>
                  <div>
                    <h4 className="font-semibold">Robert Brown</h4>
                    <p className="text-sm text-gray-600">Consultant</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  "As a consultant, keeping track of multiple clients and projects was always a challenge. ECRM makes it simple and keeps all my client information organized."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Customer Relationships?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using ECRM to grow their customer base and increase sales.
            </p>
            <Link href="/register" passHref>
              <Button size="lg" variant="secondary" className="gap-2">
                Start Your Free Trial Today <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-sm mt-4 opacity-80">No credit card required. Free plan available forever.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 font-semibold text-lg text-white mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                <span>ECRM</span>
              </div>
              <p className="text-gray-400 text-sm">
                Simplified CRM for growing businesses. Manage clients, track activities, and boost your sales.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white transition text-sm">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white transition text-sm">Pricing</Link></li>
                <li><Link href="#testimonials" className="text-gray-400 hover:text-white transition text-sm">Testimonials</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white transition text-sm">Login</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition text-sm">Help Center</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition text-sm">Blog</Link></li>
                <li><Link href="/api" className="text-gray-400 hover:text-white transition text-sm">API Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition text-sm">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition text-sm">Contact</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition text-sm">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-gray-400 flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} ECRM. All rights reserved.</p> {/* Use dynamic year */}
            <div className="flex gap-4 mt-4 md:mt-0">
              {/* Replace with actual links */}
              <Link href="#" className="hover:text-white transition">Twitter</Link>
              <Link href="#" className="hover:text-white transition">LinkedIn</Link>
              <Link href="#" className="hover:text-white transition">Facebook</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
