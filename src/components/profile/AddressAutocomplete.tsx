"use client";

import { useEffect, useRef } from "react";

export interface AddressParts {
  street: string;
  city:   string;
  state:  string;
  zip:    string;
  country: string;
}

interface AddressAutocompleteProps {
  value:          string;
  onChange:       (value: string) => void;
  onPlaceSelect:  (parts: AddressParts) => void;
  placeholder?:   string;
  className?:     string;
  id?:            string;
}

const PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

export function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "123 Main St",
  className,
  id,
}: AddressAutocompleteProps) {
  const inputRef    = useRef<HTMLInputElement>(null);
  const acRef       = useRef<google.maps.places.Autocomplete | null>(null);
  const scriptRef   = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // If no API key is configured, skip — field works as a plain text input.
    if (PLACES_API_KEY === undefined || PLACES_API_KEY === "") return;

    function initAutocomplete() {
      if (inputRef.current === null) return;
      if (typeof google === "undefined") return;

      acRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types:  ["address"],
        fields: ["address_components"],
      });

      acRef.current.addListener("place_changed", () => {
        const place = acRef.current?.getPlace();
        if (place === undefined || place.address_components === undefined) return;

        const get = (type: string) =>
          place.address_components?.find((c) => c.types.includes(type))?.long_name ?? "";
        const getShort = (type: string) =>
          place.address_components?.find((c) => c.types.includes(type))?.short_name ?? "";

        const streetNumber = get("street_number");
        const route        = get("route");
        const street       = [streetNumber, route].filter(Boolean).join(" ");

        onPlaceSelect({
          street,
          city:    get("locality") || get("sublocality") || get("postal_town"),
          state:   getShort("administrative_area_level_1"),
          zip:     get("postal_code"),
          country: get("country"),
        });

        // Update the input value to the formatted street.
        onChange(street);
      });
    }

    // If the Google Maps script is already loaded, initialise immediately.
    if (typeof window !== "undefined" && typeof google !== "undefined") {
      initAutocomplete();
      return;
    }

    // Otherwise inject the script once.
    if (document.getElementById("google-places-script") === null) {
      const script = document.createElement("script");
      script.id    = "google-places-script";
      script.src   = `https://maps.googleapis.com/maps/api/js?key=${PLACES_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
      scriptRef.current = script;
    } else {
      // Script tag exists but hasn't loaded yet — wait for it.
      const existing = document.getElementById("google-places-script") as HTMLScriptElement;
      existing.addEventListener("load", initAutocomplete);
    }

    return () => {
      if (acRef.current !== null) {
        google.maps.event.clearInstanceListeners(acRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      autoComplete="street-address"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
