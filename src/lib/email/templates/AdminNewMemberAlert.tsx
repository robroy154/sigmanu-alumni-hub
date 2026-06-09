import { Heading, Text, Button, Section, Hr } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface AdminNewMemberAlertProps {
  fullName: string;
  email:    string;
  appUrl:   string;
}

export function AdminNewMemberAlert({ fullName, email, appUrl }: AdminNewMemberAlertProps) {
  return (
    <BaseLayout preview={`Review the new account for ${fullName}`}>
      <Heading as="h1" style={S.heading1}>New member signup</Heading>
      <Text style={S.bodyText}>
        A new member has created an account and is waiting for approval.
      </Text>

      <Hr style={S.divider} />

      <table cellPadding={0} cellSpacing={0} role="presentation" style={{ margin: "0 0 24px" }}>
        <tbody>
          <tr>
            <td style={S.labelCell}>Name</td>
            <td style={S.valueCell}>{fullName}</td>
          </tr>
          <tr>
            <td style={S.labelCell}>Email</td>
            <td style={S.valueCell}>{email}</td>
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
