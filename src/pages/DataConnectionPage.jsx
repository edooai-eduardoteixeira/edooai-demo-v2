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

  // Count checked required fields
  const requiredCategories = ['REQUIRED DATA'];
  const checkedRequiredCount = Object.keys(checkedFields).filter((key) => {
    const cat = key.split(':')[0];
    return requiredCategories.includes(cat);
  }).length;

  // Bottom bar text logic
  let bottomText = 'Connect required data sources to continue.';
  if (group1Connected && !group2Connected) {
    bottomText = `1 source connected. Connect a data warehouse to complete required fields.`;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          padding: '1.5rem 3rem',
          borderBottom: '1px solid var(--color-gray-100)',
        }}
      >
        <Logo />
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '2rem 3rem',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ marginBottom: '2.5rem' }}>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--color-gray-900)',
              marginBottom: '0.75rem',
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
            }}
          >
            Connect Your Data Sources
          </h2>
          <p
            style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-gray-500)',
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
            gap: '3rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column — Integration Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <IntegrationGroup
              group={connection.group1}
              connected={group1Connected}
              connecting={group1Connecting}
              connectedPlatform={group1Platform}
              onConnect={handleGroup1Connect}
              step={1}
              totalCustomers={config.totalCustomers}
            />
            <IntegrationGroup
              group={connection.group2}
              connected={group2Connected}
              connecting={group2Connecting}
              connectedPlatform={group2Platform}
              onConnect={handleGroup2Connect}
              step={2}
              totalCustomers={config.totalCustomers}
            />
            <IntegrationGroup
              group={connection.group3}
              connected={group3Connected}
              connecting={group3Connecting}
              connectedPlatform={group3Platform}
              onConnect={handleGroup3Connect}
              step={3}
              isOptional
              totalCustomers={config.totalCustomers}
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
          backgroundColor: bothRequired ? 'var(--color-white)' : 'var(--color-gray-50)',
          padding: '1.25rem 3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem',
          transition: 'background-color 300ms ease',
        }}
      >
        <div style={{ flex: 1 }}>
          {bothRequired ? (
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-gray-900)',
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="7" fill="#2D8A4E" />
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
                <strong>{checkedRequiredCount} of {connection.requiredFieldCount}</strong> required fields
                detected
              </span>
            </p>
          ) : (
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-gray-500)',
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
            transition: 'all 300ms ease',
            transform: bothRequired ? 'scale(1)' : 'scale(0.98)',
          }}
        >
          Generate Personalized Referral Strategy
        </CTAButton>
      </div>
    </div>
  );
}
