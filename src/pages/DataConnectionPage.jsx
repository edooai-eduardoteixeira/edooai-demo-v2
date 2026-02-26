import React, { useState, useCallback, useRef } from 'react';
import Logo from '../components/Logo.jsx';
import CTAButton from '../components/CTAButton.jsx';
import IntegrationGroup from '../components/IntegrationGroup.jsx';
import DataChecklist from '../components/DataChecklist.jsx';

export default function DataConnectionPage({ config, onNext }) {
  const { connection } = config;

  const [group1Connected, setGroup1Connected] = useState(false);
  const [group2Connected, setGroup2Connected] = useState(false);
  const [group3Connected, setGroup3Connected] = useState(false);
  const [group1Connecting, setGroup1Connecting] = useState(false);
  const [group2Connecting, setGroup2Connecting] = useState(false);
  const [group3Connecting, setGroup3Connecting] = useState(false);
  const [group1Platform, setGroup1Platform] = useState(null);
  const [group2Platform, setGroup2Platform] = useState(null);
  const [group3Platform, setGroup3Platform] = useState(null);
  const [checkedFields, setCheckedFields] = useState({});
  const [highlightedCategories, setHighlightedCategories] = useState([]);

  const highlightCategories = useCallback((fieldsProvided) => {
    const cats = fieldsProvided.map((c) => c.category);
    setHighlightedCategories(cats);
    setTimeout(() => setHighlightedCategories([]), 800);
  }, []);

  const checkFieldsSequentially = useCallback(
    (fieldsProvided, sourceName, onDone) => {
      const allFields = [];
      fieldsProvided.forEach((cat) => {
        cat.fields.forEach((field) => {
          allFields.push({ category: cat.category, field });
        });
      });

      let i = 0;
      const interval = setInterval(() => {
        if (i >= allFields.length) {
          clearInterval(interval);
          if (onDone) onDone();
          return;
        }
        const { category, field } = allFields[i];
        const key = `${category}:${field.framework}`;
        setCheckedFields((prev) => ({ ...prev, [key]: sourceName }));
        i++;
      }, 200);
    },
    []
  );

  const handleGroup1Connect = useCallback(
    (platform) => {
      const selectedPlatform = connection.group1.defaultPlatform;
      setGroup1Platform(selectedPlatform);
      setGroup1Connecting(true);

      setTimeout(() => {
        setGroup1Connecting(false);
        setGroup1Connected(true);
        highlightCategories(connection.group1.fieldsProvided);
        checkFieldsSequentially(
          connection.group1.fieldsProvided,
          selectedPlatform,
          null
        );
      }, 1500);
    },
    [connection, checkFieldsSequentially, highlightCategories]
  );

  const handleGroup2Connect = useCallback(
    (platform) => {
      const selectedPlatform = connection.group2.defaultPlatform;
      setGroup2Platform(selectedPlatform);
      setGroup2Connecting(true);

      setTimeout(() => {
        setGroup2Connecting(false);
        setGroup2Connected(true);
        highlightCategories(connection.group2.fieldsProvided);
        checkFieldsSequentially(
          connection.group2.fieldsProvided,
          selectedPlatform,
          null
        );
      }, 1500);
    },
    [connection, checkFieldsSequentially, highlightCategories]
  );

  const handleGroup3Connect = useCallback(
    (platform) => {
      const selectedPlatform = connection.group3.defaultPlatform;
      setGroup3Platform(selectedPlatform);
      setGroup3Connecting(true);

      setTimeout(() => {
        setGroup3Connecting(false);
        setGroup3Connected(true);
        highlightCategories(connection.group3.fieldsProvided);
        checkFieldsSequentially(
          connection.group3.fieldsProvided,
          selectedPlatform,
          null
        );
      }, 1500);
    },
    [connection, checkFieldsSequentially, highlightCategories]
  );

  const bothRequired = group1Connected && group2Connected;
  const connectedCount = [group1Connected, group2Connected, group3Connected].filter(Boolean).length;

  // Bottom bar text logic
  let bottomText = 'Connect your CRM and data warehouse to continue.';
  if (group1Connected && !group2Connected) {
    bottomText = '1 source connected · Connect a data warehouse to continue.';
  } else if (!group1Connected && group2Connected) {
    bottomText = '1 source connected · Connect your CRM to continue.';
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', animation: 'pageEnter 0.4s ease' }}>
      {/* Header */}
      <header
        style={{
          padding: '18px 48px',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <Logo />
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '40px 48px',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ marginBottom: '36px' }}>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
            }}
          >
            Connect Your Data Sources
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            Your customer data will be used to design a personalized referral strategy.
          </p>
        </div>

        <div
          className="data-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 0.65fr',
            gap: '36px',
            alignItems: 'start',
          }}
        >
          {/* Left Column — Integration Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <IntegrationGroup
              group={connection.group1}
              connected={group1Connected}
              connecting={group1Connecting}
              connectedPlatform={group1Platform}
              onConnect={handleGroup1Connect}
              step={1}

            />
            <IntegrationGroup
              group={connection.group2}
              connected={group2Connected}
              connecting={group2Connecting}
              connectedPlatform={group2Platform}
              onConnect={handleGroup2Connect}
              step={2}

            />
            <IntegrationGroup
              group={connection.group3}
              connected={group3Connected}
              connecting={group3Connecting}
              connectedPlatform={group3Platform}
              onConnect={handleGroup3Connect}
              step={3}
              isOptional

            />
          </div>

          {/* Right Column — Data Requirements Checklist */}
          <DataChecklist
            config={config}
            checkedFields={checkedFields}
            highlightedCategories={highlightedCategories}
          />
        </div>
      </main>

      {/* Bottom Bar */}
      <div
        className="bottom-bar"
        style={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid var(--border)',
          boxShadow: 'var(--shadow-up-md)',
          backgroundColor: bothRequired ? 'var(--surface)' : 'var(--accent-subtle)',
          padding: '18px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
          transition: 'background-color var(--transition-slow)',
        }}
      >
        <div style={{ flex: 1 }}>
          {bothRequired ? (
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--text-primary)',
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" fill="var(--success)" />
                <path
                  d="M4.5 8l2.25 2.25 4.75-4.75"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>
                <strong>{connectedCount}</strong> sources connected &middot;{' '}
                <strong>{config.totalCustomers.toLocaleString()}</strong> customer records &middot;{' '}
                All required fields detected
              </span>
            </p>
          ) : (
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              {bottomText}
            </p>
          )}
        </div>
        <CTAButton
          onClick={onNext}
          disabled={!bothRequired}
          style={{
            padding: '1rem 2.5rem',
            flexShrink: 0,
            transition: 'all var(--transition-slow)',
            transform: bothRequired ? 'scale(1)' : 'scale(0.98)',
          }}
        >
          Generate Personalized Referral Strategy
        </CTAButton>
      </div>
    </div>
  );
}
