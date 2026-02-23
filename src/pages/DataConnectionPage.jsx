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
  const [showProfileNote, setShowProfileNote] = useState(false);

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
        checkFieldsSequentially(
          connection.group1.fieldsProvided,
          selectedPlatform,
          null
        );
      }, 1500);
    },
    [connection, checkFieldsSequentially]
  );

  const handleGroup2Connect = useCallback(
    (platform) => {
      const selectedPlatform = connection.group2.defaultPlatform;
      setGroup2Platform(selectedPlatform);
      setGroup2Connecting(true);

      setTimeout(() => {
        setGroup2Connecting(false);
        setGroup2Connected(true);
        checkFieldsSequentially(
          connection.group2.fieldsProvided,
          selectedPlatform,
          () => {
            setShowProfileNote(true);
          }
        );
      }, 1500);
    },
    [connection, checkFieldsSequentially]
  );

  const handleGroup3Connect = useCallback(
    (platform) => {
      const selectedPlatform = connection.group3.defaultPlatform;
      setGroup3Platform(selectedPlatform);
      setGroup3Connecting(true);

      setTimeout(() => {
        setGroup3Connecting(false);
        setGroup3Connected(true);
        checkFieldsSequentially(
          connection.group3.fieldsProvided,
          selectedPlatform,
          null
        );
      }, 1500);
    },
    [connection, checkFieldsSequentially]
  );

  const bothRequired = group1Connected && group2Connected;
  const connectedCount = [group1Connected, group2Connected, group3Connected].filter(Boolean).length;

  // Count checked required fields
  const requiredCategories = ['Customer Base', 'Transaction History', 'Behavioral Events'];
  const checkedRequiredCount = Object.keys(checkedFields).filter((key) => {
    const cat = key.split(':')[0];
    return requiredCategories.includes(cat);
  }).length;

  let bottomText = 'Connect required data sources to continue.';
  if (group1Connected && !group2Connected) {
    bottomText = 'Connect a data warehouse to complete required fields.';
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
        <h2
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            marginBottom: '0.5rem',
          }}
        >
          Connect Your Data Sources
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-gray-500)',
            marginBottom: '2rem',
          }}
        >
          Edoo AI needs access to your customer data to analyze and run referral campaigns.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 0.65fr',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column — Integration Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <IntegrationGroup
              group={connection.group1}
              connected={group1Connected}
              connecting={group1Connecting}
              connectedPlatform={group1Platform}
              onConnect={handleGroup1Connect}
            />
            <IntegrationGroup
              group={connection.group2}
              connected={group2Connected}
              connecting={group2Connecting}
              connectedPlatform={group2Platform}
              onConnect={handleGroup2Connect}
            />
            <IntegrationGroup
              group={connection.group3}
              connected={group3Connected}
              connecting={group3Connecting}
              connectedPlatform={group3Platform}
              onConnect={handleGroup3Connect}
            />
          </div>

          {/* Right Column — Data Requirements Checklist */}
          <DataChecklist
            config={config}
            checkedFields={checkedFields}
            profileNote={showProfileNote ? connection.profileDataNote : null}
          />
        </div>
      </main>

      {/* Bottom Bar */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          borderTop: '1px solid var(--color-gray-200)',
          backgroundColor: 'var(--color-white)',
          padding: '1.25rem 3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {bothRequired ? (
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-gray-700)',
                fontWeight: 500,
              }}
            >
              {connectedCount} sources connected &middot;{' '}
              {config.totalCustomers.toLocaleString()} customer records &middot;{' '}
              {checkedRequiredCount} of {connection.requiredFieldCount} required fields
              detected
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
        <CTAButton onClick={onNext} disabled={!bothRequired}>
          Generate Personalized Referral Strategy
        </CTAButton>
      </div>
    </div>
  );
}
