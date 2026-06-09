import { Heading, Text, Button, Section, Hr } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface BigBrotherNotificationEmailProps {
  memberFullName: string;
  memberEmail:    string;
  bigLine:        string; // "First Last" or "Cleared (relationship removed)"
  timestamp:      string; // pre-formatted ET timestamp
  appUrl:         string;
}

export function BigBrotherNotificationEmail({
  memberFullName,
  memberEmail,
  bigLine,
  timestamp,
  appUrl,
}: BigBrotherNotificationEmailProps) {
  return (
    <BaseLayout preview={`Big brother relationship updated for ${memberFullName}`}>
      <Heading as="h1" style={S.heading1}>Big brother relationship updated</Heading>
      <Text style={S.bodyText}>
        A member has updated their big brother relationship.
      </Text>

      <Hr style={S.divider} />

      <table cellPadding={0} cellSpacing={0} role="presentation" style={{ margin: "0 0 24px" }}>
        <tbody>
          <tr>
            <td style={S.labelCell}>Member</td>
            <td style={S.valueCell}>{memberFullName}</td>
          </tr>
          <tr>
            <td style={S.labelCell}>Email</td>
            <td style={S.valueCell}>{memberEmail}</td>
          </tr>
          <tr>
            <td style={S.labelCell}>Big brother</td>
            <td style={S.valueCell}>{bigLine}</td>
          </tr>
          <tr>
            <td style={S.labelCell}>Updated</td>
            <td style={S.valueCell}>{timestamp} ET</td>
          </tr>
        </tbody>
      </table>

      <Hr style={S.divider} />

      <Section style={S.ctaSection}>
        <Button href={`${appUrl}/admin/members`} style={S.ctaButton}>
          Review in Admin Panel →
        </Button>
      </Section>
    </BaseLayout>
  );
}
