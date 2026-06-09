import { Heading, Text, Button, Section, Hr } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface RegistrationConfirmationEmailProps {
  name:          string;
  eventTitle:    string;
  eventDate:     string;
  eventLocation: string | null;
  guestCount:    number;
  totalPaid:     number;
  appUrl:        string;
}

export function RegistrationConfirmationEmail({
  name,
  eventTitle,
  eventDate,
  eventLocation,
  guestCount,
  totalPaid,
  appUrl,
}: RegistrationConfirmationEmailProps) {
  const guestLine =
    guestCount === 0
      ? "No additional guests."
      : `${guestCount} additional guest${guestCount !== 1 ? "s" : ""} included.`;

  return (
    <BaseLayout preview={`Your registration for ${eventTitle} is confirmed. See you there!`}>
      <Heading as="h1" style={S.heading1}>You&rsquo;re registered!</Heading>
      <Text style={S.bodyText}>
        Hi {name}, your registration for{" "}
        <strong style={S.gold}>{eventTitle}</strong> is confirmed. See you there!
      </Text>

      <Hr style={S.divider} />

      <table cellPadding={0} cellSpacing={0} role="presentation" style={{ margin: "0 0 24px", width: "100%" }}>
        <tbody>
          <tr>
            <td style={S.labelCell}>Event</td>
            <td style={S.valueCell}>{eventTitle}</td>
          </tr>
          <tr>
            <td style={S.labelCell}>Date</td>
            <td style={S.valueCell}>{eventDate}</td>
          </tr>
          {eventLocation !== null && (
            <tr>
              <td style={S.labelCell}>Location</td>
              <td style={S.valueCell}>{eventLocation}</td>
            </tr>
          )}
          <tr>
            <td style={S.labelCell}>Guests</td>
            <td style={S.valueCell}>{guestLine}</td>
          </tr>
          <tr>
            <td style={S.labelCell}>Total paid</td>
            <td style={{ ...S.valueCell, ...S.gold }}>${totalPaid.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <Hr style={S.divider} />

      <Text style={S.bodyText}>
        Questions? Reach out to a chapter administrator through the alumni hub.
      </Text>

      <Section style={S.ctaSection}>
        <Button href={appUrl} style={S.ctaButton}>
          Visit the Hub →
        </Button>
      </Section>
    </BaseLayout>
  );
}
