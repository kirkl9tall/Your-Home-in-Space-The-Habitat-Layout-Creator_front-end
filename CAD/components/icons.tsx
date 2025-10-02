import React from 'react';

export const AppLogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12 2L4 6.5V15.5L12 20L20 15.5V6.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M12 13L20 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 13V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 13L4 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.5 4.25L8.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export const CubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

export const SphereIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeWidth="1.5" strokeDasharray="3 3"/>
  </svg>
);

export const CylinderIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M3 5v14a9 3 0 0 0 18 0V5"></path>
  </svg>
);

export const TorusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Z"/>
    <path d="M12,7a5,5,0,1,0,5,5A5,5,0,0,0,12,7Z"/>
  </svg>
);

export const ConeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 2l9 18H3z"></path>
        <ellipse cx="12" cy="20" rx="9" ry="2"></ellipse>
    </svg>
);

export const PlaneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
       <polygon points="2 3 22 8 2 13 6 8" />
       <polygon points="2 21 22 16 2 11 6 16" />
    </svg>
);

export const MeshIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21.5 10.5c0 2.3-1.2 4.3-3 5.5" /><path d="M2.5 10.5c0 2.3 1.2 4.3 3 5.5" />
    <path d="M12 2v2.5" /><path d="M12 19.5V22" />
    <path d="M12 2c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" />
  </svg>
);

export const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
);

export const OpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
);

export const ImportIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
);

export const ExportIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 9 12 4 17 9"></polyline>
        <line x1="12" y1="4" x2="12" y2="16"></line>
    </svg>
);

export const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

export const MagnetIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19.1 13.2a6.5 6.5 0 0 0-9.2 0l-1.3 1.3a1.5 1.5 0 0 0 2.1 2.1l1.3-1.3a4.5 4.5 0 0 1 6.4 0l1.3 1.3a1.5 1.5 0 0 0 2.1-2.1l-1.3-1.3Z"/>
    <path d="M5 13.2a6.5 6.5 0 0 1 9.2 0l1.3 1.3a1.5 1.5 0 0 1-2.1 2.1l-1.3-1.3a4.5 4.5 0 0 0-6.4 0L4.6 19.6a1.5 1.5 0 0 1-2.1-2.1l1.3-1.3Z"/>
    <path d="M12 11V3"/><path d="m5 3 2.5 3"/><path d="m19 3-2.5 3"/>
  </svg>
);

export const MoveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 2v4 M12 22v-4 M22 12h-4 M2 12h4 M19 5l-3 3 M5 19l3-3 M19 19l-3-3 M5 5l3 3"/>
    </svg>
);

export const RotateIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2.5 8a9.5 9.5 0 1 1 0 8"/><path d="M2.5 12H7"/><path d="M6 16l-4-4 4-4"/>
    </svg>
);

export const ScaleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 7V3h4"/><path d="M21 7V3h-4"/><path d="M21 17v4h-4"/><path d="M3 17v4h4"/>
        <path d="M7 12H3"/><path d="M12 17V3"/><path d="M17 12h4"/>
    </svg>
);

export const FocusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" /><path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    </svg>
);

export const UndoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
);

export const RedoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3-2.3" />
    </svg>
);

export const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m6 9 6 6 6-6" />
    </svg>
);

export const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m15 18-6-6 6-6" />
    </svg>
);

export const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m9 18 6-6-6-6" />
    </svg>
);

export const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export const DuplicateIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

export const PyramidIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 2 L2 22 H22 Z" />
        <path d="M12 2 L12 22" />
        <path d="M2 22 L12 12 L22 22" />
    </svg>
);

export const CapsuleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 8 A6 6 0 0 0 6 8" />
        <path d="M18 16 A6 6 0 0 1 6 16" />
        <line x1="6" y1="8" x2="6" y2="16" />
        <line x1="18" y1="8" x2="18" y2="16" />
    </svg>
);

export const GearIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2 L12 5 M12 19 L12 22 M22 12 L19 12 M5 12 L2 12"/>
        <path d="m19.07 4.93-2.12 2.12M7.05 16.95l-2.12 2.12M19.07 19.07l-2.12-2.12M7.05 7.05 4.93 4.93"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
);

export const GroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
    <path d="M4 16V4a2 2 0 0 1 2-2h12"></path>
  </svg>
);

export const UngroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="8" y="8" width="12" height="12" rx="2" ry="2" strokeDasharray="2 2"></rect>
    <path d="M4 16V4a2 2 0 0 1 2-2h12"></path>
    <path d="M12 2 L12 5 M19 8 L22 8 M12 22 L12 19 M5 16 L2 16"/>
  </svg>
);

export const PerspectiveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2 6.5l10-4 10 4-10 4-10-4z" />
        <path d="M2 17.5l10 4 10-4" />
        <path d="M12 2.5v19" />
        <path d="M2 6.5v11" />
        <path d="M22 6.5v11" />
    </svg>
);

export const OrthoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 3v18" />
    </svg>
);

export const EyeOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeClosedIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export const LockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

export const UnlockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
    </svg>
);

export const PlusCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
);

export const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

export const SuccessIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export const ErrorIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
);

export const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

export const MeasureIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 3 3 21" />
      <path d="M3 3v2" />
      <path d="M5 3v2" />
      <path d="M7 3v2" />
      <path d="M9 3v2" />
      <path d="M11 3v2" />
      <path d="M13 3v2" />
      <path d="M15 3v2" />
      <path d="M17 3v2" />
      <path d="M19 3v2" />
      <path d="M21 5h-2" />
      <path d="M21 7h-2" />
      <path d="M21 9h-2" />
      <path d="M21 11h-2" />
      <path d="M21 13h-2" />
      <path d="M21 15h-2" />
      <path d="M21 17h-2" />
      <path d="M21 19h-2" />
    </svg>
);

export const CameraIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

// --- NEW PROFESSIONAL MATERIAL ICONS ---

export const MaterialGoldIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="gold-pro-grad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="#FFFBEA" />
                <stop offset="60%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#B78900" />
            </radialGradient>
            <linearGradient id="gold-pro-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
                 <stop offset="50%" stopColor="white" stopOpacity="0"/>
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="url(#gold-pro-grad)" />
        <circle cx="12" cy="12" r="11" fill="url(#gold-pro-sheen)" />
    </svg>
);
export const MaterialSteelIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="steel-pro-grad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="#F5F5F5" />
                <stop offset="60%" stopColor="#B0B0B0" />
                <stop offset="100%" stopColor="#888888" />
            </radialGradient>
            <linearGradient id="steel-pro-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
                 <stop offset="50%" stopColor="white" stopOpacity="0"/>
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="url(#steel-pro-grad)" />
        <circle cx="12" cy="12" r="11" fill="url(#steel-pro-sheen)" />
    </svg>
);
export const MaterialCopperIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="copper-pro-grad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                <stop offset="0%" stopColor="#FFD7B1" />
                <stop offset="50%" stopColor="#B87333" />
                <stop offset="100%" stopColor="#8C4B22" />
            </radialGradient>
             <linearGradient id="copper-pro-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="white" stopOpacity="0.3"/>
                 <stop offset="50%" stopColor="white" stopOpacity="0"/>
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="url(#copper-pro-grad)" />
        <circle cx="12" cy="12" r="11" fill="url(#copper-pro-sheen)" />
    </svg>
);
export const MaterialPlasticIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="plastic-pro-grad" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
                <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <circle cx="12" cy="12" r="11" fill="url(#plastic-pro-grad)" />
    </svg>
);
export const MaterialRubberIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="rubber-pro-grad" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
                <stop offset="0%" stopColor="white" stopOpacity="0.1"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <circle cx="12" cy="12" r="11" fill="url(#rubber-pro-grad)" />
    </svg>
);
export const MaterialWoodIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="11" fill="currentColor"/>
        <path d="M 4 8 C 8 10, 16 6, 20 8 M 4 12 C 8 14, 16 10, 20 12 M 4 16 C 8 18, 16 14, 20 16" stroke="black" strokeOpacity="0.15" strokeWidth="1.5" fill="none"/>
    </svg>
);
export const MaterialGlassIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <radialGradient id="glass-pro-grad" cx="50%" cy="50%" r="50%">
                <stop offset="70%" stopColor="#EFFFFF" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
            </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="url(#glass-pro-grad)" />
        <circle cx="12" cy="12" r="11" stroke="white" strokeOpacity="0.2" />
        <path d="M7 8 A 8 8 0 0 1 17 8" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
    </svg>
);
export const MaterialConcreteIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <filter id="concrete-pro-texture">
                <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" stitchTiles="stitch"/>
                <feComposite operator="in" in2="SourceGraphic" result="map"/>
            </filter>
        </defs>
        <circle cx="12" cy="12" r="11" fill="currentColor"/>
        <circle cx="12" cy="12" r="11" fill="black" opacity="0.1" filter="url(#concrete-pro-texture)" />
    </svg>
);
export const MaterialGemIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="gem-pro-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="white" stop-opacity="0.5"/>
                <stop offset="100%" stop-color="white" stop-opacity="0"/>
            </linearGradient>
        </defs>
        <path d="M12 1 L 23 7 V 17 L 12 23 L 1 17 V 7 Z" fill="currentColor" />
        <path d="M12 1 L 12 23 M 1 7 L 23 17 M 1 17 L 23 7" stroke="black" stroke-opacity="0.2"/>
        <path d="M12 1 L 23 7 V 17 L 12 23 L 1 17 V 7 Z" fill="url(#gem-pro-grad)" />
    </svg>
);
export const MaterialClayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
         <defs>
            <radialGradient id="clay-pro-grad" cx="50%" cy="50%" r="50%" fx="40%" fy="40%">
                <stop offset="0%" stopColor="white" stopOpacity="0.1"/>
                <stop offset="100%" stopColor="black" stopOpacity="0.1"/>
            </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="currentColor" />
        <circle cx="12" cy="12" r="11" fill="url(#clay-pro-grad)" />
    </svg>
);
export const MaterialNeonIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <filter id="neon-pro-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" in="SourceGraphic" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <circle cx="12" cy="12" r="7" fill="currentColor" stroke="white" strokeWidth="1.5" filter="url(#neon-pro-glow)" />
    </svg>
);


export const AlignMinIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="21" y1="21" x2="3" y2="21" />
        <rect width="10" height="6" x="3" y="14" rx="1" />
        <rect width="10" height="10" x="11" y="4" rx="1" />
    </svg>
);
export const AlignCenterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="21" y1="12" x2="3" y2="12" />
        <rect width="10" height="6" x="7" y="14" rx="1" />
        <rect width="10" height="10" x="7" y="4" rx="1" />
    </svg>
);
export const AlignMaxIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="21" y1="3" x2="3" y2="3" />
        <rect width="10" height="6" x="11" y="4" rx="1" />
        <rect width="10" height="10" x="3" y="11" rx="1" />
    </svg>
);

export const DistributeHorizontalIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="21" y1="17" x2="3" y2="17" />
        <line x1="21" y1="7" x2="3" y2="7" />
        <rect width="5" height="10" x="4" y="9" rx="1" />
        <rect width="5" height="6" x="15" y="9" rx="1" />
    </svg>
);
export const DistributeVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="7" y1="21" x2="7" y2="3" />
        <line x1="17" y1="21" x2="17" y2="3" />
        <rect width="10" height="5" x="9" y="4" rx="1" />
        <rect width="6" height="5" x="9" y="15" rx="1" />
    </svg>
);

export const MirrorIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 19V5" strokeDasharray="2 2" />
        <path d="M8 12h10" />
        <path d="m5 12-3 4" />
        <path d="m5 12-3-4" />
    </svg>
);

export const HelpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

export const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export const GridIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18M9 3v18M3 15h18M15 3v18" />
    </svg>
);

export const ArrangeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="3" y1="6" x2="14" y2="6" />
        <line x1="3" y1="12" x2="18" y2="12" />
        <line x1="3" y1="18" x2="16" y2="18" />
    </svg>
);

export const TextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
        <path d="M12 18V7" />
        <path d="M9 7h6" />
    </svg>
);

export const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

export const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

export const SvgIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4.5 12.5a8 8 0 1 0 16 0" />
        <path d="M20 12.5c0-1.5-1.2-3.2-3-3s-3 1.5-3 3c0-1.5-1.2-3-3-3s-3 1.5-3 3" />
        <path d="M15 12.5c0-1.5-1.2-3-3-3" />
        <path d="M4.5 12.5c0-1.5 1.2-3 3-3" />
        <path d="M9 9.5c.8-.8 2.2-.8 3 0" />
    </svg>
);