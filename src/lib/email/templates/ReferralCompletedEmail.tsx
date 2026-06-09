import { Heading, Text, Button, Section } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface ReferralCompletedEmailProps {
  referrerFirstName: string;
  inviteeFirstName:  string;
  inviteeLastName:   string;
  appUrl:            string;
}

export function ReferralCompletedEmail({
  referrerFirstName,
  inviteeFirstName,
  inviteeLastName,
  appUrl,
}: ReferralCompletedEmailProps) {
  return (
    <BaseLayout preview={`${inviteeFirstName} ${inviteeLastName} just created their account!`}>
      <Heading as="h1" style={S.heading1}>
        {inviteeFirstName} {inviteeLastName} just joined!
      </Heading>
      <Text style={S.bodyText}>
        Hi {referrerFirstName},{" "}
        <strong style={S.white}>
          {inviteeFirstName} {inviteeLastName}
        </strong>{" "}
        just created their account using your invite link. Welcome them to the
        hub!
      </Text>

      <Section style={S.ctaSection}>
        <Button href={`${appUrl}/directory`} style={S.ctaButton}>
          View the Directory →
        </Button>
      </Section>
    </BaseLayout>
  );
}
