import { Heading, Text, Button, Section } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface WaitlistPromotionEmailProps {
  firstName:       string;
  eventTitle:      string;
  registrationUrl: string;
}

export function WaitlistPromotionEmail({
  firstName,
  eventTitle,
  registrationUrl,
}: WaitlistPromotionEmailProps) {
  return (
    <BaseLayout preview={`A spot has opened up for ${eventTitle} — complete your registration`}>
      <Heading as="h1" style={S.heading1}>A spot opened up!</Heading>
      <Text style={S.bodyText}>Hi {firstName},</Text>
      <Text style={S.bodyText}>
        Good news — a spot has opened up for{" "}
        <strong style={S.gold}>{eventTitle}</strong>!
      </Text>
      <Text style={S.bodyText}>
        You were on the waitlist and now have a chance to register. Complete
        your registration soon, as spots are limited.
      </Text>

      <Section style={S.ctaSection}>
        <Button href={registrationUrl} style={S.ctaButton}>
          Complete Registration →
        </Button>
      </Section>

      <Text style={{ color: "#6B6B73", fontSize: "13px", fontFamily: "Arial, sans-serif", margin: "16px 0 0", textAlign: "center" }}>
        If you&rsquo;re no longer interested, you can simply ignore this email.
      </Text>
    </BaseLayout>
  );
}
