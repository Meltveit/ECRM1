"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type SyntheticEvent } from "react";

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc: string;
}

export function ImageWithFallback({ src, fallbackSrc, alt, ...props }: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);

  const handleError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn(`Error loading image: ${src}. Falling back to ${fallbackSrc}`);
    setImgSrc(fallbackSrc);
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={handleError}
      {...props}
    />
  );
}
