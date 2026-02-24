import React from 'react';

const PLATFORM_COLORS = {
  Segment: '#52BD95',
  Braze: '#ED5C2B',
  Klaviyo: '#000000',
  HubSpot: '#FF7A59',
  'Customer.io': '#1B9AAA',
  Snowflake: '#29B5E8',
  BigQuery: '#669DF6',
  Redshift: '#8C4FFF',
  Databricks: '#FF3621',
  Synapse: '#0078D4',
  Zendesk: '#03363D',
  Intercom: '#286EFA',
  Delighted: '#6B4FBB',
};

// Simple Icons paths (24x24 viewBox) for platforms that have them
const SIMPLE_ICON_PATHS = {
  Snowflake: 'M24 3.459c0 .646-.418 1.18-1.141 1.18-.723 0-1.142-.534-1.142-1.18 0-.647.419-1.18 1.142-1.18.723 0 1.141.533 1.141 1.18zm-.228 0c0-.533-.38-.951-.913-.951s-.913.38-.913.95c0 .533.38.952.913.952.57 0 .913-.419.913-.951zm-1.37-.533h.495c.266 0 .456.152.456.38 0 .153-.076.229-.19.305l.19.266v.038h-.266l-.19-.266h-.229v.266h-.266zm.495.228h-.229v.267h.229c.114 0 .152-.038.152-.114.038-.077-.038-.153-.152-.153zM7.602 12.4c.038-.151.076-.304.076-.456 0-.114-.038-.228-.038-.342-.114-.343-.304-.647-.646-.838l-4.87-2.777c-.685-.38-1.56-.152-1.94.533-.381.685-.153 1.56.532 1.94l2.701 1.56-2.701 1.56c-.685.38-.913 1.256-.533 1.94.38.685 1.256.914 1.94.533l4.832-2.777c.343-.267.571-.533.647-.876zm1.332 2.626c-.266-.038-.57.038-.837.19l-4.832 2.777c-.685.38-.913 1.256-.532 1.94.38.686 1.255.914 1.94.533l2.701-1.56v3.12c0 .8.647 1.408 1.446 1.408.799 0 1.407-.647 1.407-1.408v-5.592c0-.761-.57-1.37-1.293-1.408zm4.946-6.088c.266.038.57-.038.837-.19l4.832-2.777c.685-.38.913-1.256.532-1.94-.38-.686-1.255-.914-1.94-.533l-2.701 1.56V1.975c0-.799-.647-1.408-1.446-1.408-.799 0-1.446.609-1.446 1.408V7.53c0 .76.609 1.37 1.332 1.407zM3.265 5.97l4.832 2.777c.266.152.533.19.837.19.723-.038 1.331-.684 1.331-1.407V1.975c0-.799-.646-1.408-1.407-1.408-.799 0-1.446.647-1.446 1.408v3.12l-2.701-1.56c-.685-.38-1.56-.152-1.94.533-.419.646-.19 1.521.494 1.902zm9.093 6.011a.412.412 0 00-.114-.266l-.57-.571a.346.346 0 00-.267-.114.412.412 0 00-.266.114l-.571.57a.411.411 0 00-.114.267c0 .076.038.19.114.267l.57.57a.345.345 0 00.267.114c.076 0 .19-.038.266-.114l.571-.57a.412.412 0 00.114-.267zm1.598.533L11.94 14.53c-.039.038-.153.114-.229.114h-.608a.411.411 0 01-.267-.114L8.82 12.514a.408.408 0 01-.076-.229v-.608c0-.076.038-.19.114-.267l2.016-2.016a.41.41 0 01.267-.114h.608a.41.41 0 01.267.114l2.016 2.016a.347.347 0 01.114.267v.608c-.076.077-.114.19-.19.229zm5.593 5.44l-4.832-2.777c-.266-.152-.57-.19-.837-.152-.723.038-1.332.684-1.332 1.408v5.554c0 .8.647 1.408 1.408 1.408.799 0 1.446-.647 1.446-1.408v-3.12l2.7 1.56c.686.38 1.561.152 1.941-.533.419-.646.19-1.521-.494-1.94zm2.549-7.533l-2.701 1.56 2.7 1.56c.686.38.914 1.256.533 1.94-.38.685-1.255.913-1.94.533l-4.832-2.778a1.644 1.644 0 01-.647-.798c-.037-.153-.076-.305-.076-.457 0-.114.039-.228.039-.342.114-.343.342-.647.646-.837l4.832-2.778c.685-.38 1.56-.152 1.94.533.457.609.19 1.484-.494 1.864',
  BigQuery: 'M5.676 10.595h2.052v5.244a5.892 5.892 0 0 1-2.052-2.088v-3.156zm18.179 10.836a.504.504 0 0 1 0 .708l-1.716 1.716a.504.504 0 0 1-.708 0l-4.248-4.248a.206.206 0 0 1-.007-.007c-.02-.02-.028-.045-.043-.066a10.736 10.736 0 0 1-6.334 2.065C4.835 21.599 0 16.764 0 10.799S4.835 0 10.8 0s10.799 4.835 10.799 10.8c0 2.369-.772 4.553-2.066 6.333.025.017.052.028.074.05l4.248 4.248zm-5.028-10.632a8.015 8.015 0 1 0-8.028 8.028h.024a8.016 8.016 0 0 0 8.004-8.028zm-4.86 4.98a6.002 6.002 0 0 0 2.04-2.184v-1.764h-2.04v3.948zm-4.5.948c.442.057.887.08 1.332.072.4.025.8.025 1.2 0V7.692H9.468v9.035z',
  Databricks: 'M.95 14.184L12 20.403l9.919-5.55v2.21L12 22.662l-10.484-5.96-.565.308v.77L12 24l11.05-6.218v-4.317l-.515-.309L12 19.118l-9.867-5.653v-2.21L12 16.805l11.05-6.218V6.32l-.515-.308L12 11.974 2.647 6.681 12 1.388l7.76 4.368.668-.411v-.566L12 0 .95 6.27v.72L12 13.207l9.919-5.55v2.26L12 15.52 1.516 9.56l-.565.308Z',
  Zendesk: 'M12.914 2.904V16.29L24 2.905H12.914zM0 2.906C0 5.966 2.483 8.45 5.543 8.45s5.542-2.484 5.543-5.544H0zm11.086 4.807L0 21.096h11.086V7.713zm7.37 7.84c-3.063 0-5.542 2.48-5.542 5.543H24c0-3.06-2.48-5.543-5.543-5.543z',
  Intercom: 'M21 0H3C1.343 0 0 1.343 0 3v18c0 1.658 1.343 3 3 3h18c1.658 0 3-1.342 3-3V3c0-1.657-1.342-3-3-3zm-5.801 4.399c0-.44.36-.8.802-.8.44 0 .8.36.8.8v10.688c0 .442-.36.801-.8.801-.443 0-.802-.359-.802-.801V4.399zM11.2 3.994c0-.44.357-.799.8-.799s.8.359.8.799v11.602c0 .44-.357.8-.8.8s-.8-.36-.8-.8V3.994zm-4 .405c0-.44.359-.8.799-.8.443 0 .802.36.802.8v10.688c0 .442-.36.801-.802.801-.44 0-.799-.359-.799-.801V4.399zM3.199 6c0-.442.36-.8.802-.8.44 0 .799.358.799.8v7.195c0 .441-.359.8-.799.8-.443 0-.802-.36-.802-.8V6zM20.52 18.202c-.123.105-3.086 2.593-8.52 2.593-5.433 0-8.397-2.486-8.521-2.593-.335-.288-.375-.792-.086-1.128.285-.334.79-.375 1.125-.09.047.041 2.693 2.211 7.481 2.211 4.848 0 7.456-2.186 7.479-2.207.334-.289.839-.25 1.128.086.289.336.25.84-.086 1.128zm.281-5.007c0 .441-.36.8-.801.8-.441 0-.801-.36-.801-.8V6c0-.442.361-.8.801-.8.441 0 .801.357.801.8v7.195z',
  HubSpot: 'M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z',
};

// Custom SVG components for platforms not in Simple Icons
function SegmentIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={color} />
      <rect x="5" y="10.5" width="14" height="3" rx="1.5" fill="white" />
      <rect x="8" y="5.5" width="11" height="3" rx="1.5" fill="white" opacity="0.7" />
      <rect x="5" y="15.5" width="11" height="3" rx="1.5" fill="white" opacity="0.7" />
    </svg>
  );
}

function BrazeIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.5 2 7 6 7 8c0 2.5 1.5 3.5 2.5 5S10 16 10 18c0 1 .5 4 2 4s2-3 2-4c0-2-.5-3.5.5-5S17 10.5 17 8c0-2-1.5-6-5-6z" fill={color} />
      <path d="M12 6c-1.5 0-2.5 2-2.5 3.5 0 1 .5 2 1.25 3 .5.7.75 1.5 1 2.5h.5c.25-1 .5-1.8 1-2.5.75-1 1.25-2 1.25-3C14.5 8 13.5 6 12 6z" fill="white" opacity="0.4" />
    </svg>
  );
}

function KlaviyoIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M2 4v16l8-5.333L18 20l4-2.667V4H2zm16 12.667l-6-4L6 16.667V6.667h12v10z" />
    </svg>
  );
}

function CustomerIoIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-2c0-3.314 3.582-6 8-6s8 2.686 8 6v2H4z" />
      <circle cx="19" cy="8" r="3" fill="none" stroke={color} strokeWidth="2" />
      <line x1="19" y1="5" x2="19" y2="11" stroke={color} strokeWidth="1.5" />
      <line x1="16" y1="8" x2="22" y2="8" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function RedshiftIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill={color} />
      <path d="M12 2v20M3 7l9 5 9-5M3 17l9-5 9 5" stroke="white" strokeWidth="0.8" opacity="0.5" />
      <path d="M12 7l5 3-5 3-5-3 5-3z" fill="white" opacity="0.3" />
    </svg>
  );
}

function SynapseIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="4" r="2.5" fill={color} />
      <circle cx="4" cy="12" r="2.5" fill={color} />
      <circle cx="20" cy="12" r="2.5" fill={color} />
      <circle cx="8" cy="20" r="2.5" fill={color} />
      <circle cx="16" cy="20" r="2.5" fill={color} />
      <line x1="12" y1="6.5" x2="5.5" y2="10" stroke={color} strokeWidth="1.5" />
      <line x1="12" y1="6.5" x2="18.5" y2="10" stroke={color} strokeWidth="1.5" />
      <line x1="5.5" y1="14" x2="8" y2="17.5" stroke={color} strokeWidth="1.5" />
      <line x1="18.5" y1="14" x2="16" y2="17.5" stroke={color} strokeWidth="1.5" />
      <line x1="10.5" y1="20" x2="13.5" y2="20" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function DelightedIcon({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={color} />
      <circle cx="8.5" cy="10" r="1.5" fill="white" />
      <circle cx="15.5" cy="10" r="1.5" fill="white" />
      <path d="M7.5 14.5c0 0 2 3 4.5 3s4.5-3 4.5-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SimpleIconSvg({ path, color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d={path} />
    </svg>
  );
}

function PlatformIcon({ name, color, size }) {
  const simpleIconPath = SIMPLE_ICON_PATHS[name];
  if (simpleIconPath) {
    return <SimpleIconSvg path={simpleIconPath} color={color} size={size} />;
  }

  switch (name) {
    case 'Segment': return <SegmentIcon color={color} size={size} />;
    case 'Braze': return <BrazeIcon color={color} size={size} />;
    case 'Klaviyo': return <KlaviyoIcon color={color} size={size} />;
    case 'Customer.io': return <CustomerIoIcon color={color} size={size} />;
    case 'Redshift': return <RedshiftIcon color={color} size={size} />;
    case 'Synapse': return <SynapseIcon color={color} size={size} />;
    case 'Delighted': return <DelightedIcon color={color} size={size} />;
    default: return null;
  }
}

export default function PlatformLogo({ name, connected, connecting, onClick }) {
  const color = PLATFORM_COLORS[name] || '#666';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        border: connected
          ? '2px solid var(--color-green-500)'
          : '2px solid var(--color-gray-200)',
        backgroundColor: connected
          ? 'var(--color-green-50)'
          : 'var(--color-white)',
        cursor: connected || connecting ? 'default' : 'pointer',
        transition: 'all var(--transition-base)',
        minWidth: '80px',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {connecting ? (
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '2.5px solid var(--color-gray-200)',
              borderTopColor: color,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        ) : connected ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="var(--color-green-500)" />
            <path
              d="M7 12l3.5 3.5 6.5-6.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <PlatformIcon name={name} color={color} size={28} />
        )}
      </div>
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          color: 'var(--color-gray-700)',
          textAlign: 'center',
        }}
      >
        {name}
      </span>
      {connected && (
        <span
          style={{
            fontSize: '0.625rem',
            color: 'var(--color-green-600)',
            fontWeight: 500,
          }}
        >
          Connected
        </span>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
