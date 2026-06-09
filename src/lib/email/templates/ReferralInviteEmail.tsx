import { Heading, Text, Button, Section, Hr } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface ReferralInviteEmailProps {
  inviteeFirstName:  string;
  referrerFullName:  string;
  inviteUrl:         string;
}

export function ReferralInviteEmail({
  inviteeFirstName,
  referrerFullName,
  inviteUrl,
}: ReferralInviteEmailProps) {
  return (
    <BaseLayout preview={`${referrerFullName} has invited you to join the Sigma Nu Mu Xi Alumni Hub`}>
      <Heading as="h1" style={S.heading1}>
        You&rsquo;ve been invited, {inviteeFirstName}!
      </Heading>
      <Text style={S.bodyText}>
        <strong style={S.white}>{referrerFullName}</strong> has invited you to
        join the{" "}
        <strong style={S.gold}>Sigma Nu Mu Xi Chapter Alumni Hub</strong> —
        the private platform for Mu Xi Chapter brothers.
      </Text>
      <Text style={S.bodyText}>
        Use the link below to create your account. This invitation expires in{" "}
        <strong style={S.white}>7 days</strong>.
      </Text>

      <Section style={S.ctaSection}>
        <Button href={inviteUrl} style={S.ctaButton}>
          Create My Account →
        </Button>
      </Section>

      <Hr style={S.divider} />

      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", fontFamily: "Arial, sans-serif", textAlign: "center", margin: 0 }}>
        If you weren&rsquo;t expecting this invite, you can safely ignore this email.
      </Text>
    </BaseLayout>
  );
}
