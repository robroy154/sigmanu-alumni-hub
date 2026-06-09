import { Heading, Text, Button, Section } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface LittleBrotherNotificationEmailProps {
  bigFirstName:    string;
  littleFirstName: string;
  littleLastName:  string;
  appUrl:          string;
}

export function LittleBrotherNotificationEmail({
  bigFirstName,
  littleFirstName,
  littleLastName,
  appUrl,
}: LittleBrotherNotificationEmailProps) {
  return (
    <BaseLayout
      preview={`${littleFirstName} ${littleLastName} has added you as their Big Brother`}
    >
      <Heading as="h1" style={S.heading1}>You have a new Little Brother!</Heading>
      <Text style={S.bodyText}>
        Hi {bigFirstName},{" "}
        <strong style={S.white}>
          {littleFirstName} {littleLastName}
        </strong>{" "}
        has added you as their Big Brother in the Mu Xi Alumni Hub.
      </Text>
      <Text style={S.bodyText}>
        You can see your full lineage on the family tree.
      </Text>

      <Section style={S.ctaSection}>
        <Button href={`${appUrl}/family-tree`} style={S.ctaButton}>
          View Family Tree →
        </Button>
      </Section>
    </BaseLayout>
  );
}
