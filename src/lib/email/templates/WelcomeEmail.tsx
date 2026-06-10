import { Heading, Text, Button, Section, Hr } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";
import * as S from "./styles";

interface WelcomeEmailProps {
  firstName: string;
  appUrl:    string;
}

export function WelcomeEmail({ firstName, appUrl }: WelcomeEmailProps) {
  return (
    <BaseLayout preview={`Your account has been approved. Welcome to the Brotherhood, ${firstName}!`}>
      <Heading as="h1" style={S.heading1}>
        Welcome to the Brotherhood, {firstName}!
      </Heading>
      <Text style={S.bodyText}>
        Your account has been approved by a chapter administrator. You now have
        full access to the Mu Xi Alumni Hub.
      </Text>
      <Text style={S.bodyText}>Here&rsquo;s what you can do:</Text>

      <table cellPadding={0} cellSpacing={4} role="presentation" style={{ margin: "0 0 24px" }}>
        <tbody>
          {[
            { label: "Browse the Brother Directory",    href: `${appUrl}/directory`    },
            { label: "Explore the Chapter Family Tree", href: `${appUrl}/family-tree`  },
            { label: "Complete your member profile",    href: `${appUrl}/profile`      },
            { label: "Register for upcoming events",    href: `${appUrl}/events`       },
          ].map(({ label, href }) => (
            <tr key={label}>
              <td style={S.bulletRow}>
                &bull;&nbsp;{" "}
                <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#C6A75E", textDecoration: "none", fontWeight: "bold" }}>
                  {label}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Hr style={S.divider} />

      <Section style={S.ctaSection}>
        <Button href={`${appUrl}/directory`} style={S.ctaButton}>
          Go to the Hub →
        </Button>
      </Section>
    </BaseLayout>
  );
}
