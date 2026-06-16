import { Heading, Text, Button, Section, Hr } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface RefundConfirmationEmailProps {
  name:           string;
  eventTitle:     string;
  eventDate:      string;
  amountRefunded: number;
  appUrl:         string;
}

export function RefundConfirmationEmail({
  name,
  eventTitle,
  eventDate,
  amountRefunded,
  appUrl,
}: RefundConfirmationEmailProps) {
  return (
    <BaseLayout preview={`Your refund for ${eventTitle} has been processed`}>
      <Heading as="h1" style={S.heading1}>Your refund has been processed</Heading>
      <Text style={S.bodyText}>
        Hi {name}, your refund for{" "}
        <strong style={S.gold}>{eventTitle}</strong> has been processed.
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
          <tr>
            <td style={S.labelCell}>Amount Refunded</td>
            <td style={{ ...S.valueCell, ...S.gold }}>${amountRefunded.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <Hr style={S.divider} />

      <Text style={S.bodyText}>
        Please allow a few business days for the refund to appear on your
        original payment method&rsquo;s statement.
      </Text>

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
