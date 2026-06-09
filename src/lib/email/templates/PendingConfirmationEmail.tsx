import { Heading, Text, Button, Section } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface PendingConfirmationEmailProps {
  firstName: string;
  appUrl:    string;
}

export function PendingConfirmationEmail({ firstName, appUrl }: PendingConfirmationEmailProps) {
  return (
    <BaseLayout preview="Your account is pending review by a chapter administrator.">
      <Heading as="h1" style={S.heading1}>Thanks for signing up, {firstName}!</Heading>
      <Text style={S.bodyText}>
        Your account for the{" "}
        <strong style={S.gold}>Sigma Nu Mu Xi Chapter Alumni Hub</strong> has
        been received and is pending review by a chapter administrator.
      </Text>
      <Text style={S.bodyText}>
        You will receive an email as soon as your account is approved. This
        typically happens within a day or two.
      </Text>
      <Text style={S.bodyText}>
        In the meantime, you can return to sign in at any time — you&rsquo;ll
        be held at the pending approval page until an admin activates your
        account.
      </Text>

      <Section style={S.ctaSection}>
        <Button href={`${appUrl}/login`} style={S.ctaButton}>
          Sign In →
        </Button>
      </Section>
    </BaseLayout>
  );
}
