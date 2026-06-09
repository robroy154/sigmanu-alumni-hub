import { Heading, Text, Hr } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface ReferralSentEmailProps {
  referrerFirstName: string;
  inviteeFirstName:  string;
  inviteeLastName:   string;
}

export function ReferralSentEmail({
  referrerFirstName,
  inviteeFirstName,
  inviteeLastName,
}: ReferralSentEmailProps) {
  return (
    <BaseLayout preview={`Your invitation to ${inviteeFirstName} ${inviteeLastName} has been sent`}>
      <Heading as="h1" style={S.heading1}>Your invite has been sent!</Heading>
      <Text style={S.bodyText}>
        Hi {referrerFirstName}, your invitation to{" "}
        <strong style={S.white}>
          {inviteeFirstName} {inviteeLastName}
        </strong>{" "}
        has been sent. You&rsquo;ll receive a notification here as soon as they
        create their account.
      </Text>

      <Hr style={S.divider} />

      <Text style={S.bodyText}>
        Invite links are valid for 7 days. If {inviteeFirstName} doesn&rsquo;t
        sign up in time, you can send a new invite from your profile page.
      </Text>
    </BaseLayout>
  );
}
