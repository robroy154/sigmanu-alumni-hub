import type * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from "@react-email/components";

interface BaseLayoutProps {
  preview?: string;
  children: React.ReactNode;
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: "32px 16px",
  backgroundColor: "#0B0B0C",
  fontFamily: "Arial, sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "560px",
  backgroundColor: "#121214",
  borderRadius: "12px",
  border: "1px solid rgba(198,167,94,0.25)",
};

const headerSectionStyle: React.CSSProperties = {
  padding: "24px 32px",
  textAlign: "center",
};

const goldHrStyle: React.CSSProperties = {
  borderTopWidth: "2px",
  borderTopStyle: "solid",
  borderTopColor: "#C6A75E",
  borderBottom: "none",
  borderLeft: "none",
  borderRight: "none",
  margin: 0,
};

const subtleHrStyle: React.CSSProperties = {
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "rgba(198,167,94,0.15)",
  borderBottom: "none",
  borderLeft: "none",
  borderRight: "none",
  margin: 0,
};

const contentSectionStyle: React.CSSProperties = {
  padding: "32px 36px",
};

const footerSectionStyle: React.CSSProperties = {
  padding: "20px 32px",
  textAlign: "center",
};

const logoStyle: React.CSSProperties = {
  display: "inline-block",
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  backgroundColor: "#C6A75E",
  lineHeight: "44px",
  textAlign: "center",
  fontSize: "18px",
  fontWeight: "bold",
  color: "#0B0B0C",
};

const chapterTextStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#C6A75E",
  fontSize: "11px",
  letterSpacing: "3px",
  textTransform: "uppercase",
  fontFamily: "Arial, sans-serif",
  textAlign: "center",
};

const footerTextStyle: React.CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.35)",
  fontSize: "11px",
  fontFamily: "Arial, sans-serif",
  lineHeight: "1.6",
  textAlign: "center",
};

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <style>{`:root { color-scheme: dark; }`}</style>
      </Head>
      {preview !== undefined && <Preview>{preview}</Preview>}
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* ΣΝ header */}
          <Section style={headerSectionStyle}>
            <div style={logoStyle}>ΣΝ</div>
            <Text style={chapterTextStyle}>Sigma Nu · Mu Xi Chapter</Text>
          </Section>

          <Hr style={goldHrStyle} />

          {/* Main content */}
          <Section style={contentSectionStyle}>
            {children}
          </Section>

          <Hr style={subtleHrStyle} />

          {/* Footer */}
          <Section style={footerSectionStyle}>
            <Text style={footerTextStyle}>
              Sigma Nu Fraternity · Mu Xi Chapter · Columbus State University
              <br />
              This is an automated message — please do not reply directly.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
