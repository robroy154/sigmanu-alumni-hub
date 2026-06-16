import { Heading, Text, Hr } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface RefundProcessedAdminAlertProps {
  registrantName:  string;
  registrantEmail: string;
  eventTitle:      string;
  eventDate:       string;
  amountRefunded:  number;
  paymentIntentId: string;
  timestamp:       string; // pre-formatted ET timestamp
}

export function RefundProcessedAdminAlert({
  registrantName,
  registrantEmail,
  eventTitle,
  eventDate,
  amountRefunded,
  paymentIntentId,
  timestamp,
}: RefundProcessedAdminAlertProps) {
  return (
    <BaseLayout preview={`A refund was processed for ${registrantName}`}>
      <Heading as="h1" style={S.heading1}>Refund processed</Heading>
      <Text style={S.bodyText}>
        A registration refund was processed through the admin panel.
      </Text>

      <Hr style={S.divider} />

      <table cellPadding={0} cellSpacing={0} role="presentation" style={{ margin: "0 0 24px" }}>
        <tbody>
          <tr>
            <td style={S.labelCell}>Registrant</td>
            <td style={S.valueCell}>{registrantName}</td>
          </tr>
          <tr>
            <td style={S.labelCell}>Email</td>
            <td style={S.valueCell}>{registrantEmail}</td>
          </tr>
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
          <tr>
            <td style={S.labelCell}>Stripe Payment Intent</td>
            <td style={S.valueCell}>{paymentIntentId}</td>
          </tr>
          <tr>
            <td style={S.labelCell}>Processed</td>
            <td style={S.valueCell}>{timestamp} ET</td>
          </tr>
        </tbody>
      </table>

      <Hr style={S.divider} />

      <Text style={S.bodyText}>
        This is an automated notification — no action is required.
      </Text>
    </BaseLayout>
  );
}
