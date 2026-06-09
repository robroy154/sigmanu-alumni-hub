import { Heading, Button, Section, Hr } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface AnnouncementEmailProps {
  title:          string;
  serializedBody: string; // pre-serialized by serializeRichTextToEmail()
  appUrl:         string;
}

export function AnnouncementEmail({ title, serializedBody, appUrl }: AnnouncementEmailProps) {
  return (
    <BaseLayout preview={title}>
      <Heading as="h1" style={S.heading1}>{title}</Heading>

      {/* The body is already serialized to email-safe HTML by serialize-rich-text.ts.
          dangerouslySetInnerHTML is safe here — the serializer strips all disallowed
          tags and blocks javascript: hrefs. */}
      <div dangerouslySetInnerHTML={{ __html: serializedBody }} />

      <Hr style={S.divider} />

      <Section style={S.ctaSection}>
        <Button href={`${appUrl}/home`} style={S.ctaButton}>
          Visit the Hub →
        </Button>
      </Section>
    </BaseLayout>
  );
}
