"use client";
import * as React from 'react';
import { AppealFormData, UploadedDocument } from '@/types';
import { APPEAL_TYPES, ROOT_CAUSES, CORRECTIVE_ACTIONS, PREVENTIVE_MEASURES, SUPPORTING_DOCUMENT_TYPES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { formatAppealText } from '@/lib/format-appeal';
import { DocumentIcon, ChecklistIcon, MailIcon, ShieldCheckIcon } from '@/components/icons/DocumentIcon';

// --- TYPE DEFINITIONS ---
type IconProps = { className?: string };
type RadioCardProps = {
    id: string;
    name: string;
    value: string;
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
type CheckboxCardProps = {
    id: string;
    name: string;
    value: string;
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
type StepProps = {
    data: AppealFormData;
    setData: React.Dispatch<React.SetStateAction<AppealFormData>>;
};

// --- SVG ICONS ---
const CheckCircleIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UploadIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
);

// Sparkles Icon for Generate Appeal
const SparklesIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22.5l-.394-1.933a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

// Refresh/Regenerate Icon
const RefreshIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

// --- INITIAL FORM DATA ---
const initialFormData: AppealFormData = {
    appealType: '',
    fullName: '',
    storeName: '',
    email: '',
    sellerId: '',
    asins: [],
    rootCauses: [],
    rootCauseDetails: '',
    unauthorizedSupplier: '',
    relatedAccountReason: '',
    categoryRejectionReason: '',
    detailPageAbuseArea: [],
    correctiveActionsTaken: [],
    correctiveActionsDetails: '',
    preventiveMeasures: [],
    preventiveMeasuresDetails: '',
    uploadedDocuments: [],
    status: 'draft',
};

// --- HELPER COMPONENTS ---
const StyledInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
);

const IconTextarea = ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} rows={props.rows || 4} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"></textarea>
);

// Scrollable container with visual indicators
const ScrollContainer = ({ children, className = "", showGradients = true }: { children: React.ReactNode; className?: string; showGradients?: boolean }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [showBottomGradient, setShowBottomGradient] = React.useState(false);

    const checkScroll = () => {
        if (!scrollRef.current || !showGradients) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowBottomGradient(scrollTop < scrollHeight - clientHeight - 20);
    };

    React.useEffect(() => {
        checkScroll();
        const scrollElement = scrollRef.current;
        scrollElement?.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        return () => {
            scrollElement?.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [children, showGradients]);

    return (
        <div className="relative">
            <div ref={scrollRef} className={className} onScroll={checkScroll}>
                {children}
            </div>
            {showGradients && showBottomGradient && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none flex items-end justify-center pb-2">
                    <div className="text-indigo-600 animate-bounce">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

const RadioCard = ({ id, name, value, label, checked, onChange }: RadioCardProps) => (
    <label htmlFor={id} className={`relative block p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${checked ? 'bg-indigo-50 border-indigo-600 shadow-lg' : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'}`}>
        <input type="radio" id={id} name={name} value={value} checked={checked} onChange={onChange} className="hidden" />
        <span className="font-medium text-slate-900 text-base leading-relaxed">{label}</span>
        {checked && (
            <div className="absolute top-3 right-3 text-indigo-600 animate-in fade-in zoom-in duration-200">
                <CheckCircleIcon className="w-6 h-6" />
            </div>
        )}
    </label>
);

const CheckboxCard = ({ id, name, value, label, checked, onChange }: CheckboxCardProps) => (
    <label htmlFor={id} className={`block p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${checked ? 'bg-indigo-50 border-indigo-600 shadow-lg' : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'}`}>
        <div className="flex items-start gap-4">
            <div className={`w-6 h-6 border-2 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-200 ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                {checked && (
                    <svg className="w-4 h-4 text-white animate-in zoom-in duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
            <span className="font-medium text-slate-900 text-base leading-relaxed flex-1">{label}</span>
        </div>
        <input type="checkbox" id={id} name={name} value={value} checked={checked} onChange={onChange} className="hidden" />
    </label>
);

// --- STEP COMPONENTS ---

// Step 1: Appeal Type Selection
const Step1_AppealType = ({ data, setData }: StepProps) => (
    <div>
        <h2 className="text-3xl font-bold mb-3 text-slate-900">What is the primary reason for your account action?</h2>
        <p className="text-slate-600 text-lg mb-8">Select the option that best matches your situation</p>
        <ScrollContainer className="space-y-4 max-h-[65vh] overflow-y-auto pr-3">
            {APPEAL_TYPES.map(type => (
                <RadioCard
                    key={type.value}
                    id={type.value}
                    name="appealType"
                    value={type.value}
                    label={type.label}
                    checked={data.appealType === type.value}
                    onChange={(e) => setData({ ...data, appealType: e.target.value as any })}
                />
            ))}
        </ScrollContainer>
    </div>
);

// Step 2: Account & Identification Details
const Step2_AccountDetails = ({ data, setData }: StepProps) => {
    const handleAsinChange = (value: string) => {
        const asins = value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        setData({ ...data, asins });
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-900">Account & Identification Details</h2>
            <p className="text-slate-600 text-lg mb-8">Your information is used only to generate your appeal</p>
            <div className="space-y-6">
                <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-2">Full Name / Business Name *</label>
                    <StyledInput
                        type="text"
                        id="fullName"
                        value={data.fullName}
                        onChange={e => setData({ ...data, fullName: e.target.value })}
                        placeholder="e.g., Jennifer Smith or FloLeaf Naturals LLC"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="storeName" className="block text-sm font-semibold text-slate-700 mb-2">Store Name / Company Name *</label>
                    <StyledInput
                        type="text"
                        id="storeName"
                        value={data.storeName}
                        onChange={e => setData({ ...data, storeName: e.target.value })}
                        placeholder="e.g., BNC Media LLC"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Registered Email Address *</label>
                    <StyledInput
                        type="email"
                        id="email"
                        value={data.email}
                        onChange={e => setData({ ...data, email: e.target.value })}
                        placeholder="e.g., youremail@example.com"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="sellerId" className="block text-sm font-semibold text-slate-700 mb-2">Seller ID / Merchant Token</label>
                    <StyledInput
                        type="text"
                        id="sellerId"
                        value={data.sellerId}
                        onChange={e => setData({ ...data, sellerId: e.target.value })}
                        placeholder="e.g., A144ZI53VPJJAS"
                    />
                </div>
                <div>
                    <label htmlFor="asins" className="block text-sm font-semibold text-slate-700 mb-2">ASINs Related to This Issue</label>
                    <IconTextarea
                        id="asins"
                        value={data.asins.join('\n')}
                        onChange={e => handleAsinChange(e.target.value)}
                        rows={3}
                        placeholder="Enter ASINs (one per line or comma-separated)&#10;e.g., B07GFQVDZB, B08CRSYCQS"
                    />
                    <p className="text-xs text-slate-500 mt-1">Separate multiple ASINs with commas or new lines</p>
                </div>
            </div>
        </div>
    );
};

// Step 3: Root Cause Analysis (Conditional)
const Step3_RootCause = ({ data, setData }: StepProps) => {
    const handleCheckboxChange = (value: string) => {
        const newRootCauses = data.rootCauses.includes(value)
            ? data.rootCauses.filter(c => c !== value)
            : [...data.rootCauses, value];
        setData({ ...data, rootCauses: newRootCauses });
    };

    // Get root causes based on appeal type
    const getRootCausesForType = () => {
        const type = data.appealType as keyof typeof ROOT_CAUSES;
        return ROOT_CAUSES[type] || [];
    };

    const rootCauseOptions = getRootCausesForType();

    return (
        <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-900">Root Cause Analysis</h2>
            <p className="text-slate-600 text-lg mb-6">What caused this issue? Select all that apply.</p>
            
            <div className="space-y-6">
                {rootCauseOptions.length > 0 ? (
                    <>
                        <ScrollContainer className="space-y-4 max-h-[60vh] overflow-y-auto pr-3">
                            {rootCauseOptions.map((cause, index) => (
                                <CheckboxCard
                                    key={index}
                                    id={`cause-${index}`}
                                    name="rootCauses"
                                    value={cause}
                                    label={cause}
                                    checked={data.rootCauses.includes(cause)}
                                    onChange={() => handleCheckboxChange(cause)}
                                />
                            ))}
                        </ScrollContainer>

                        {/* Conditional fields based on appeal type */}
                        {data.appealType === 'inauthenticity-supply-chain' && data.rootCauses.some(c => c.includes('supplier')) && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Unauthorized Supplier Name (if applicable)</label>
                                <StyledInput
                                    type="text"
                                    value={data.unauthorizedSupplier}
                                    onChange={e => setData({ ...data, unauthorizedSupplier: e.target.value })}
                                    placeholder="e.g., Morandelli, Walmart.com"
                                />
                            </div>
                        )}

                        {data.appealType === 'related-account' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">What caused Amazon to link your accounts?</label>
                                <IconTextarea
                                    value={data.relatedAccountReason}
                                    onChange={e => setData({ ...data, relatedAccountReason: e.target.value })}
                                    rows={4}
                                    placeholder="e.g., An old, suspended account was found..."
                                />
                            </div>
                        )}

                        {data.appealType === 'category-approval' && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">What reason did Amazon give for the rejection?</label>
                                <IconTextarea
                                    value={data.categoryRejectionReason}
                                    onChange={e => setData({ ...data, categoryRejectionReason: e.target.value })}
                                    rows={4}
                                    placeholder="e.g., Amazon claimed the lab was not CPSC-accepted..."
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Root Cause Details (Optional)</label>
                            <IconTextarea
                                value={data.rootCauseDetails}
                                onChange={e => setData({ ...data, rootCauseDetails: e.target.value })}
                                rows={4}
                                placeholder="Provide any additional context about what caused this issue..."
                            />
                        </div>
                    </>
                ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-amber-800">Please describe the root cause of your issue:</p>
                        <IconTextarea
                            value={data.rootCauseDetails}
                            onChange={e => setData({ ...data, rootCauseDetails: e.target.value })}
                            rows={6}
                            placeholder="Describe what caused this issue in detail..."
                            className="mt-3"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Step 4: Corrective Actions Taken
const Step4_CorrectiveActions = ({ data, setData }: StepProps) => {
    const handleCheckboxChange = (value: string) => {
        const newActions = data.correctiveActionsTaken.includes(value)
            ? data.correctiveActionsTaken.filter(a => a !== value)
            : [...data.correctiveActionsTaken, value];
        setData({ ...data, correctiveActionsTaken: newActions });
    };

    // Get corrective actions based on appeal type
    const getCorrectiveActionsForType = () => {
        // For KDP, Relay, and Merch - use different agreement review, not Business Solutions Agreement
        const isSpecialPlatform = data.appealType === 'kdp-acx-merch' || data.appealType === 'amazon-relay';

        // Start with general actions, but exclude Business Solutions Agreement for special platforms
        let actions: string[] = isSpecialPlatform
            ? CORRECTIVE_ACTIONS.general.filter(action => !action.includes('Business Solutions Agreement'))
            : [...CORRECTIVE_ACTIONS.general];

        if (data.appealType.includes('inauthenticity') || data.appealType.includes('supply-chain')) {
            actions = [...actions, ...CORRECTIVE_ACTIONS.inauthenticity];
        }
        if (data.appealType === 'intellectual-property') {
            actions = [...actions, ...CORRECTIVE_ACTIONS.intellectualProperty];
        }
        if (data.appealType === 'seller-code-conduct') {
            actions = [...actions, ...CORRECTIVE_ACTIONS.codeOfConduct];
        }
        if (data.appealType === 'restricted-products') {
            actions = [...actions, ...CORRECTIVE_ACTIONS.restrictedProducts];
        }
        if (data.appealType === 'verification-failure') {
            actions = [...actions, ...CORRECTIVE_ACTIONS.verificationFailure];
        }
        if (data.appealType === 'related-account') {
            actions = [...actions, ...CORRECTIVE_ACTIONS.relatedAccount];
        }
        if (data.appealType === 'detail-page-abuse') {
            actions = [...actions, ...CORRECTIVE_ACTIONS.detailPageAbuse];
        }
        if (data.appealType === 'category-approval') {
            actions = [...actions, ...CORRECTIVE_ACTIONS.categoryApproval];
        }
        // Add platform-specific agreement reviews
        if (data.appealType === 'kdp-acx-merch') {
            actions = [...actions, ...CORRECTIVE_ACTIONS.kdpAcxMerch];
        }
        if (data.appealType === 'amazon-relay') {
            actions = [...actions, ...CORRECTIVE_ACTIONS.relay];
        }

        return actions;
    };

    const actionOptions = getCorrectiveActionsForType();

    return (
        <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-900">Corrective Actions Taken</h2>
            <p className="text-slate-600 text-lg mb-6">What immediate actions have you ALREADY completed? Select all that apply.</p>
            
            <div className="space-y-6">
                <ScrollContainer className="space-y-4 max-h-[50vh] overflow-y-auto pr-3">
                    {actionOptions.map((action, index) => (
                        <CheckboxCard
                            key={index}
                            id={`action-${index}`}
                            name="correctiveActions"
                            value={action}
                            label={action}
                            checked={data.correctiveActionsTaken.includes(action)}
                            onChange={() => handleCheckboxChange(action)}
                        />
                    ))}
                </ScrollContainer>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Corrective Action Details (Optional)</label>
                    <IconTextarea
                        value={data.correctiveActionsDetails}
                        onChange={e => setData({ ...data, correctiveActionsDetails: e.target.value })}
                        rows={4}
                        placeholder="Describe any other specific actions you've taken to fix this issue..."
                    />
                </div>
            </div>
        </div>
    );
};

// Step 5: Preventive Measures
const Step5_PreventiveMeasures = ({ data, setData }: StepProps) => {
    const handleCheckboxChange = (value: string) => {
        const newMeasures = data.preventiveMeasures.includes(value)
            ? data.preventiveMeasures.filter(m => m !== value)
            : [...data.preventiveMeasures, value];
        setData({ ...data, preventiveMeasures: newMeasures });
    };

    const allMeasures = [
        { category: 'Sourcing & Supplier Vetting', items: PREVENTIVE_MEASURES.sourcing },
        { category: 'Listing, IP & Detail Page Integrity', items: PREVENTIVE_MEASURES.listing },
        { category: 'Review & Sales Rank Compliance', items: PREVENTIVE_MEASURES.reviewManipulation },
        { category: 'Operations & Monitoring', items: PREVENTIVE_MEASURES.operations },
    ];

    return (
        <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-900">Preventive Measures</h2>
            <p className="text-slate-600 text-lg mb-6">What steps will you take to PREVENT this from happening again?</p>
            
            <div className="space-y-6">
                <ScrollContainer className="space-y-6 max-h-[60vh] overflow-y-auto pr-3" showGradients={false}>
                    {allMeasures.map((group) => (
                        <div key={group.category}>
                            <h3 className="text-md font-bold text-indigo-700 mb-3 border-b border-indigo-200 pb-2">{group.category}</h3>
                            <div className="space-y-3">
                                {group.items.map((measure, index) => (
                                    <CheckboxCard
                                        key={`${group.category}-${index}`}
                                        id={`measure-${group.category}-${index}`}
                                        name="preventiveMeasures"
                                        value={measure}
                                        label={measure}
                                        checked={data.preventiveMeasures.includes(measure)}
                                        onChange={() => handleCheckboxChange(measure)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </ScrollContainer>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Preventive Measure Details (Optional)</label>
                    <IconTextarea
                        value={data.preventiveMeasuresDetails}
                        onChange={e => setData({ ...data, preventiveMeasuresDetails: e.target.value })}
                        rows={4}
                        placeholder="Describe any other specific preventive measures you'll implement..."
                    />
                </div>
            </div>
        </div>
    );
};

// Step 6: Supporting Documentation
const Step6_SupportingDocuments = ({ data, setData }: StepProps) => {
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        const newDocuments: UploadedDocument[] = files.map(file => ({
            id: uuidv4(),
            type: 'other',
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date(),
        }));

        setData({
            ...data,
            uploadedDocuments: [...data.uploadedDocuments, ...newDocuments],
        });
    };

    const removeDocument = (id: string) => {
        setData({
            ...data,
            uploadedDocuments: data.uploadedDocuments.filter(doc => doc.id !== id),
        });
    };

    // Group documents by category
    const groupedDocTypes = SUPPORTING_DOCUMENT_TYPES.reduce((acc, doc) => {
        const category = doc.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(doc);
        return acc;
    }, {} as Record<string, Array<typeof SUPPORTING_DOCUMENT_TYPES[number]>>);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <DocumentIcon className="w-8 h-8 text-indigo-600" />
                Supporting Documentation
            </h2>
            <p className="text-slate-600 text-lg mb-6">Upload documents to support your appeal</p>
            
            <div className="space-y-6">
                {/* File Upload Area */}
                <div className="relative">
                    <input
                        type="file"
                        id="documents"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.docx,.txt,.xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors bg-slate-50 hover:bg-indigo-50/30">
                        <UploadIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium mb-2">Click to upload or drag and drop</p>
                        <p className="text-xs text-slate-500">PDF, PNG, JPG, DOCX, XLSX, CSV, TXT files up to 10MB each</p>
                    </div>
                </div>

                {/* Uploaded Files */}
                {data.uploadedDocuments.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-3">Uploaded Documents ({data.uploadedDocuments.length}):</p>
                        <ScrollContainer className="space-y-3 max-h-[40vh] overflow-y-auto" showGradients={false}>
                            {data.uploadedDocuments.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                                    <div className="flex items-center flex-1 min-w-0">
                                        <DocumentIcon className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
                                        <span className="text-sm text-slate-700 truncate">{doc.fileName}</span>
                                        <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                                            ({(doc.fileSize / 1024 / 1024).toFixed(2)} MB)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeDocument(doc.id)}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium ml-4 flex-shrink-0"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </ScrollContainer>
                    </div>
                )}

                {/* Document Guide */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
                        <ChecklistIcon className="w-6 h-6 text-blue-700" />
                        Supporting Documentation Guide
                    </h4>
                    <p className="text-sm text-blue-800 mb-4 leading-relaxed">
                        Review your Amazon suspension notice to identify the specific documents required for your case. Below is a comprehensive list of commonly requested documentation organized by category:
                    </p>
                    <ScrollContainer className="space-y-4 text-sm text-blue-700 max-h-[30vh] overflow-y-auto pr-2" showGradients={false}>
                        {Object.entries(groupedDocTypes).map(([category, docs]) => (
                            <div key={category} className="bg-white/60 rounded-lg p-3 border border-blue-100">
                                <p className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                    {category}
                                </p>
                                <ul className="space-y-1.5 ml-4">
                                    {docs.map(doc => (
                                        <li key={doc.value} className="flex items-start gap-2">
                                            <span className="text-blue-400 mt-1">▸</span>
                                            <span className="text-blue-800">{doc.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </ScrollContainer>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-xs text-blue-700 italic flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>Pro Tip: Upload clear, legible copies of all required documents. Ensure invoices include complete supplier information, dates, and match your account details exactly.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Step 7: Review & Generate
const Step7_Review = ({ 
    data, 
    onGenerate, 
    isGenerating, 
    progress, 
    status, 
    streamedText 
}: StepProps & { 
    onGenerate: () => void; 
    isGenerating: boolean;
    progress?: number;
    status?: string;
    streamedText?: string;
}) => {
    return (
        <div>
            <h2 className="text-3xl font-bold mb-3 text-slate-900 flex items-center gap-3">
                <ShieldCheckIcon className="w-8 h-8 text-indigo-600" />
                Final Review & Submission
            </h2>
            <p className="text-slate-600 text-lg mb-6">Please carefully review your information below before generating your professional appeal letter</p>
            
            <ScrollContainer className="space-y-5 max-h-[60vh] overflow-y-auto pr-3" showGradients={false}>
                {/* Account Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">Account Information</h3>
                    <div className="text-sm text-slate-700 space-y-1">
                        <p><span className="font-medium">Name:</span> {data.fullName}</p>
                        <p><span className="font-medium">Store:</span> {data.storeName}</p>
                        <p><span className="font-medium">Email:</span> {data.email}</p>
                        {data.sellerId && <p><span className="font-medium">Seller ID:</span> {data.sellerId}</p>}
                        {data.asins.length > 0 && <p><span className="font-medium">ASINs:</span> {data.asins.join(', ')}</p>}
                    </div>
                </div>

                {/* Appeal Type */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 mb-2">Issue Type</h3>
                    <p className="text-sm text-slate-700">
                        {APPEAL_TYPES.find(t => t.value === data.appealType)?.label || data.appealType}
                    </p>
                </div>

                {/* Root Causes */}
                {data.rootCauses.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Root Causes ({data.rootCauses.length})</h3>
                        <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                            {data.rootCauses.slice(0, 3).map((cause, i) => <li key={i}>{cause}</li>)}
                            {data.rootCauses.length > 3 && <li className="text-slate-500">...and {data.rootCauses.length - 3} more</li>}
                        </ul>
                    </div>
                )}

                {/* Corrective Actions */}
                {data.correctiveActionsTaken.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Corrective Actions ({data.correctiveActionsTaken.length})</h3>
                        <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                            {data.correctiveActionsTaken.slice(0, 3).map((action, i) => <li key={i}>{action}</li>)}
                            {data.correctiveActionsTaken.length > 3 && <li className="text-slate-500">...and {data.correctiveActionsTaken.length - 3} more</li>}
                        </ul>
                    </div>
                )}

                {/* Preventive Measures */}
                {data.preventiveMeasures.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Preventive Measures ({data.preventiveMeasures.length})</h3>
                        <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                            {data.preventiveMeasures.slice(0, 3).map((measure, i) => <li key={i}>{measure}</li>)}
                            {data.preventiveMeasures.length > 3 && <li className="text-slate-500">...and {data.preventiveMeasures.length - 3} more</li>}
                        </ul>
                    </div>
                )}

                {/* Documents */}
                {data.uploadedDocuments.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Supporting Documents ({data.uploadedDocuments.length})</h3>
                        <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                            {data.uploadedDocuments.map((doc, i) => <li key={i}>{doc.fileName}</li>)}
                        </ul>
                    </div>
                )}
            </ScrollContainer>

            {/* Intuitive Progress Dialogue */}
            {isGenerating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
                        {/* Animated Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-4">
                                    <SparklesIcon className="w-12 h-12 text-white animate-pulse" />
                                </div>
                            </div>
                        </div>
                        
                        {/* Dynamic Message */}
                        <div className="text-center space-y-4">
                            <h3 className="text-2xl font-bold text-slate-900">Crafting Your Appeal</h3>
                            <p className="text-lg text-slate-600 leading-relaxed min-h-[60px]">
                                {getProgressMessage(progress || 0)}
                            </p>
                            
                            {/* Animated Progress Indicator */}
                            <div className="flex justify-center space-x-2 py-4">
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            
                            {/* Subtle percentage indicator */}
                            <p className="text-sm text-slate-400 font-medium">{progress || 0}% Complete</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8">
                <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-lg transition-all shadow-md hover:shadow-lg disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating Your Appeal...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-6 h-6" />
                            Generate My Appeal Letter
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// Step 8: Generated Appeal
const Step8_GeneratedAppeal = ({ data, appealText }: StepProps & { appealText: string }) => {
    const [copied, setCopied] = React.useState(false);

    const copyToClipboard = () => {
        // Clean the appeal text before copying
        let cleanedText = appealText.replace(/---SECTION BREAK---/g, '');
        cleanedText = cleanedText.replace(/\[Contact phone not provided\]/gi, '');
        
        navigator.clipboard.writeText(cleanedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadPDF = async () => {
        // Dynamic import to reduce bundle size
        const { jsPDF } = await import('jspdf');
        
        // Create new PDF document
        const doc = new jsPDF({
            unit: 'pt',
            format: 'letter'
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 72; // 1 inch margins
        const contentWidth = pageWidth - (margin * 2);
        const bottomMargin = 72; // Space for footer at bottom
        let yPosition = margin;
        
        // Helper function to check if we need a new page
        const checkPageBreak = (neededSpace: number) => {
            if (yPosition + neededSpace > pageHeight - bottomMargin) {
                doc.addPage();
                yPosition = margin;
                return true;
            }
            return false;
        };
        
        // Add Subject line at the top
        doc.setFontSize(11);
        doc.setFont('times', 'bold');
        const appealTypeLabel = APPEAL_TYPES.find(t => t.value === data.appealType)?.label || data.appealType;
        const subjectText = `Subject: Appeal for Reinstatement: ${appealTypeLabel}`;
        const subjectLines = doc.splitTextToSize(subjectText, contentWidth);
        doc.text(subjectLines, margin, yPosition);
        yPosition += subjectLines.length * 14 + 10;
        
        // Add a line separator
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 20;
        
        // Clean the appeal text - remove section breaks and placeholders
        let cleanedAppealText = appealText.replace(/---SECTION BREAK---/g, '');
        
        // Remove placeholder contact phone if it exists
        cleanedAppealText = cleanedAppealText.replace(/\[Your Contact Phone\]\s*/g, '');
        
        // Process appeal text
        doc.setFont('times', 'normal');
        doc.setFontSize(12);
        
        // Split into paragraphs but keep markdown for processing
        const paragraphs = cleanedAppealText.split('\n\n').filter(p => p.trim());
        
        paragraphs.forEach((para, index) => {
            const trimmedPara = para.trim();
            if (!trimmedPara) return;
            
            // Check if this is a signature block (contains line breaks and email)
            if (trimmedPara.includes('\n') && !trimmedPara.includes('\n\n')) {
                const lines = trimmedPara.split('\n').map(l => l.trim()).filter(l => l);
                const hasEmail = lines.some(l => l.includes('@'));
                
                if (hasEmail && lines.length >= 2) {
                    // This is a signature block - render each line separately
                    checkPageBreak(lines.length * 18 + 30);
                    yPosition += 20; // Extra space before signature
                    
                    lines.forEach((line, lineIdx) => {
                        // Check if this is the salutation line
                        if (/^(Best regards|Sincerely|Respectfully|Regards),?$/i.test(line)) {
                            doc.setFont('times', 'normal');
                            doc.text(line, margin, yPosition);
                            yPosition += 30; // Extra space after salutation
                        } else {
                            // Regular signature line
                            doc.setFont('times', 'normal');
                            doc.text(line, margin, yPosition);
                            yPosition += 14; // Single line spacing
                        }
                    });
                    yPosition += 10; // Space after signature block
                    return;
                }
            }
            
            // Check if it's a section header (all caps or title-like without punctuation)
            const isSectionHeader = /^[A-Z][^.!?]*[A-Z][^.!?]*$/.test(trimmedPara) && 
                                   trimmedPara.split(' ').length <= 10 && 
                                   !trimmedPara.startsWith('-');
            
            // Check if it's a subsection header (ends with colon)
            const isSubHeader = trimmedPara.endsWith(':') && 
                               !trimmedPara.startsWith('-') && 
                               trimmedPara.split(' ').length <= 8;
            
            // Check if it's a bullet point
            const isBulletPoint = /^-\s+/.test(trimmedPara);
            
            if (isSectionHeader) {
                // Major section header
                checkPageBreak(50);
                yPosition += 20; // Extra space before section
                doc.setFont('times', 'bold');
                doc.setFontSize(13);
                const cleanPara = trimmedPara.replace(/\*\*/g, '');
                const lines = doc.splitTextToSize(cleanPara, contentWidth);
                doc.text(lines, margin, yPosition);
                yPosition += lines.length * 18 + 12;
                doc.setFontSize(12);
                doc.setFont('times', 'normal');
            } else if (isSubHeader) {
                // Subsection header
                checkPageBreak(40);
                yPosition += 12;
                doc.setFont('times', 'bold');
                const cleanPara = trimmedPara.replace(/\*\*/g, '');
                const lines = doc.splitTextToSize(cleanPara, contentWidth);
                doc.text(lines, margin, yPosition);
                yPosition += lines.length * 16 + 8;
                doc.setFont('times', 'normal');
            } else if (isBulletPoint) {
                // Bullet point
                checkPageBreak(35);
                yPosition += 6;
                
                const content = trimmedPara.replace(/^-\s+/, '').replace(/\*\*/g, '');
                const bulletIndent = 20;
                
                // Check if bullet has a bold header
                const boldMatch = content.match(/^([^:]+):\s*(.*)/);
                
                if (boldMatch) {
                    const [, header, description] = boldMatch;
                    
                    // Draw bullet
                    doc.setFontSize(14);
                    doc.text('•', margin, yPosition);
                    doc.setFontSize(12);
                    
                    // Draw bold header
                    doc.setFont('times', 'bold');
                    const headerLines = doc.splitTextToSize(header + ':', contentWidth - bulletIndent);
                    doc.text(headerLines, margin + bulletIndent, yPosition);
                    yPosition += headerLines.length * 16;
                    
                    // Draw description
                    if (description.trim()) {
                        doc.setFont('times', 'normal');
                        const descLines = doc.splitTextToSize(description.trim(), contentWidth - bulletIndent);
                        doc.text(descLines, margin + bulletIndent, yPosition);
                        yPosition += descLines.length * 16 + 6;
                    } else {
                        yPosition += 6;
                    }
                } else {
                    // Simple bullet
                    doc.setFontSize(14);
                    doc.text('•', margin, yPosition);
                    doc.setFontSize(12);
                    
                    const lines = doc.splitTextToSize(content, contentWidth - bulletIndent);
                    doc.text(lines, margin + bulletIndent, yPosition);
                    yPosition += lines.length * 16 + 6;
                }
            } else {
                // Regular paragraph
                checkPageBreak(30);
                const cleanPara = trimmedPara.replace(/\*\*/g, '');
                const lines = doc.splitTextToSize(cleanPara, contentWidth);
                doc.text(lines, margin, yPosition);
                yPosition += lines.length * 16 + 12;
            }
        });
        
        // Add page numbers to all pages (centered at bottom)
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setFont('times', 'normal');
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
        }
        
        // Save the PDF
        doc.save(`Amazon-Appeal-${data.fullName.replace(/\s+/g, '-')}.pdf`);
    };

    // Format appeal text with proper Word-like styling
    const formatAppealForDisplay = (text: string) => {
        // Remove section break markers
        let cleanedText = text.replace(/---SECTION BREAK---/g, '');
        
        // Remove placeholder phone text
        cleanedText = cleanedText.replace(/\[Contact phone not provided\]/gi, '');
        
        // Split into paragraphs
        const paragraphs = cleanedText.split('\n\n').filter(p => p.trim());
        
        return paragraphs.map((para, idx) => {
            const trimmedPara = para.trim();
            
            // Skip empty paragraphs
            if (!trimmedPara) return '';
            
            // Check if this is a closing signature block (multiple single lines)
            // Signature blocks typically have name, company, email on separate lines
            if (trimmedPara.includes('\n') && !trimmedPara.includes('\n\n')) {
                const lines = trimmedPara.split('\n').map(l => l.trim()).filter(l => l);
                
                // Check if it looks like a signature block (has email or contains common signature elements)
                const hasEmail = lines.some(l => l.includes('@'));
                const hasCommonSignatureWords = lines.some(l => 
                    /^(Best regards|Sincerely|Respectfully|Regards),?$/i.test(l)
                );
                
                if ((hasEmail || hasCommonSignatureWords) && lines.length >= 2) {
                    // Format as signature block with proper spacing
                    return `<div key="${idx}" style="margin-top: 2rem; margin-bottom: 1.5rem; line-height: 1.6;">
                        ${lines.map(line => {
                            // Check if this is the salutation line (Best regards, Sincerely, etc.)
                            if (/^(Best regards|Sincerely|Respectfully|Regards),?$/i.test(line)) {
                                return `<p style="margin-bottom: 2rem; color: #334155;">${line}</p>`;
                            }
                            return `<p style="margin-bottom: 0.4rem; color: #1e293b; font-weight: 500;">${line}</p>`;
                        }).join('')}
                    </div>`;
                }
            }
            
            // Handle bold text with both **text** and *text*
            let formatted = trimmedPara.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
            formatted = formatted.replace(/\*([^*\n]+?)\*/g, '<strong>$1</strong>');
            
            // Check if it's a major section header (all caps or title-like)
            const isMajorHeader = /^[A-Z][^.!?]*[A-Z][^.!?]*$/.test(trimmedPara) && trimmedPara.split(' ').length <= 10;
            
            // Check if it's a subsection header ending with colon
            const isSubHeader = trimmedPara.endsWith(':') && !trimmedPara.startsWith('-') && trimmedPara.split(' ').length <= 8;
            
            // Check if it's a bullet point (starts with -)
            const isBulletPoint = /^-\s+/.test(trimmedPara);
            
            // Check if it's a numbered list item (1., 2., 3., etc.)
            const isNumberedList = /^\d+\.\s/.test(trimmedPara);
            
            if (isMajorHeader) {
                return `<h3 key="${idx}" style="margin-top: 2rem; margin-bottom: 1rem; font-weight: 700; font-size: 1.15rem; color: #1e293b; line-height: 1.4; letter-spacing: 0.5px;">${formatted}</h3>`;
            } else if (isSubHeader) {
                return `<h4 key="${idx}" style="margin-top: 1.5rem; margin-bottom: 0.75rem; font-weight: 700; font-size: 1.05rem; color: #334155; line-height: 1.4;">${formatted}</h4>`;
            } else if (isBulletPoint) {
                // Extract the content after the dash
                const content = formatted.replace(/^-\s+/, '');
                const [boldPart, ...restParts] = content.split('</strong>');
                
                if (boldPart.includes('<strong>')) {
                    // Has a bold header
                    const header = boldPart.replace('<strong>', '');
                    const description = restParts.join('</strong>').replace(/^:\s*/, '');
                    
                    return `<div key="${idx}" style="margin-left: 2rem; margin-bottom: 0.85rem; padding-left: 1.5rem; position: relative; line-height: 1.75;">
                        <span style="position: absolute; left: 0; top: 0.25rem; color: #3b82f6; font-size: 1.2rem; font-weight: bold;">•</span>
                        <div>
                            <strong style="color: #1e293b; font-size: 1rem;">${header}</strong>
                            ${description ? `<span style="color: #475569; display: block; margin-top: 0.25rem;">${description}</span>` : ''}
                        </div>
                    </div>`;
                } else {
                    // Simple bullet
                    return `<div key="${idx}" style="margin-left: 2rem; margin-bottom: 0.65rem; padding-left: 1.5rem; position: relative; line-height: 1.75; color: #475569;">
                        <span style="position: absolute; left: 0; top: 0.25rem; color: #3b82f6; font-size: 1.2rem; font-weight: bold;">•</span>
                        <span>${content}</span>
                    </div>`;
                }
            } else if (isNumberedList) {
                return `<div key="${idx}" style="margin-top: 0.75rem; margin-bottom: 0.75rem; margin-left: 1.5rem; line-height: 1.85; color: #334155;">${formatted}</div>`;
            } else {
                // Regular paragraph with improved readability
                return `<p key="${idx}" style="margin-bottom: 1.35rem; line-height: 1.85; color: #334155; text-align: justify; font-size: 1rem;">${formatted}</p>`;
            }
        }).filter(html => html).join('');
    };

    return (
        <div className="text-center">
            <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold mb-3 text-slate-900 flex items-center justify-center gap-3">
                <MailIcon className="w-8 h-8 text-green-600" />
                Your Appeal is Ready!
            </h2>
            <p className="text-slate-600 text-lg mb-6">Review your professional Plan of Action below</p>

            {/* Professional Word-like document container */}
            <div className="bg-white border-2 border-slate-300 rounded-xl shadow-2xl overflow-hidden mb-6">
                <ScrollContainer className="max-h-[60vh] overflow-y-auto" showGradients={false}>
                    <div 
                        className="p-12 bg-white text-left"
                        style={{
                            fontFamily: "'Georgia', 'Times New Roman', Times, serif",
                            fontSize: '13pt',
                            lineHeight: '1.75',
                            maxWidth: '8.5in',
                            margin: '0 auto',
                            color: '#1e293b',
                        }}
                        dangerouslySetInnerHTML={{ __html: formatAppealForDisplay(appealText) }}
                    />
                </ScrollContainer>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={copyToClipboard}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                    {copied ? (
                        <>
                            <CheckCircleIcon className="w-5 h-5" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <DocumentIcon className="w-5 h-5" />
                            Copy to Clipboard
                        </>
                    )}
                </button>
                <button
                    onClick={downloadPDF}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download as PDF
                </button>
            </div>

            <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl text-left shadow-sm">
                <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-lg">
                    <ChecklistIcon className="w-6 h-6 text-amber-700" />
                    Submission Instructions
                </h4>
                <p className="text-sm text-amber-800 mb-4 leading-relaxed">
                    Follow these steps carefully to submit your appeal to Amazon Seller Performance:
                </p>
                <ol className="space-y-3 text-sm text-amber-900">
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xs">1</span>
                        <span><strong>Copy or Download:</strong> Use the buttons above to copy your appeal text or download it as a formatted PDF document.</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xs">2</span>
                        <span><strong>Access Seller Central:</strong> Log in to your Amazon Seller Central account at <span className="font-mono text-xs">sellercentral.amazon.com</span></span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xs">3</span>
                        <span><strong>Navigate to Appeals:</strong> Go to <span className="font-semibold">Performance → Account Health → Appeals</span> or check your Performance Notifications</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xs">4</span>
                        <span><strong>Paste Your Appeal:</strong> Copy your appeal letter and paste it into the appropriate text field provided by Amazon</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xs">5</span>
                        <span><strong>Attach Documents:</strong> Upload all supporting documents you prepared (invoices, certificates, IDs, etc.) as required by your suspension notice</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xs">6</span>
                        <span><strong>Submit & Monitor:</strong> Submit your appeal and monitor your email for Amazon's response. Typical response time is 24-48 hours, though complex cases may take longer</span>
                    </li>
                </ol>
                <div className="mt-4 pt-4 border-t border-amber-200">
                    <p className="text-xs text-amber-700 flex items-start gap-2">
                        <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span><strong>Important:</strong> Do not submit multiple appeals for the same issue. Wait for Amazon's response before taking further action. If you need to provide additional information, reply to Amazon's response email directly.</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- PROGRESS BAR ---
const ProgressBar = ({ steps, currentStepIndex }: { steps: string[]; currentStepIndex: number }) => (
    <div className="mb-10">
        <div className="flex justify-between items-center">
            {steps.map((step, index) => (
                <React.Fragment key={step}>
                    <div className="flex flex-col items-center text-center">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                index <= currentStepIndex
                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-110'
                                    : 'bg-slate-200 text-slate-500'
                            }`}
                        >
                            <span className="text-sm font-bold">
                                {index < currentStepIndex ? <CheckCircleIcon className="w-5 h-5" /> : index + 1}
                            </span>
                        </div>
                        <p className={`mt-2 text-xs font-semibold ${index <= currentStepIndex ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {step}
                        </p>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`flex-1 h-1 mx-1 transition-all duration-300 ${index < currentStepIndex ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    </div>
);

// Helper function to get engaging progress messages
const getProgressMessage = (progress: number): string => {
    if (progress < 10) return "Analyzing your case details...";
    if (progress < 25) return "Reviewing Amazon's policies and guidelines...";
    if (progress < 40) return "Structuring your professional appeal...";
    if (progress < 55) return "Incorporating best practices from successful appeals...";
    if (progress < 70) return "Crafting compelling arguments for your case...";
    if (progress < 85) return "Finalizing your personalized appeal letter...";
    if (progress < 95) return "Polishing and formatting your document...";
    return "Almost ready! Just a moment more...";
};

// --- MAIN COMPONENT ---
export default function UpdatedMultiStepForm({ onBackToHome }: { onBackToHome?: () => void }) {
    const [currentStep, setCurrentStep] = React.useState(1);
    const [formData, setFormData] = React.useState<AppealFormData>(initialFormData);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [generatedAppeal, setGeneratedAppeal] = React.useState('');
    const [generationProgress, setGenerationProgress] = React.useState(0);
    const [generationStatus, setGenerationStatus] = React.useState('');
    const [streamedText, setStreamedText] = React.useState('');

    const totalSteps = 8;
    const stepNames = ['Type', 'Account', 'Cause', 'Actions', 'Prevention', 'Documents', 'Review', 'Appeal'];

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationProgress(0);
        setGenerationStatus('Initializing...');
        setStreamedText('');
        
        try {
            const sections: string[] = [];
            const totalSections = 5;
            
            // Generate each section sequentially (each has its own 30-second Lambda window)
            for (let sectionId = 1; sectionId <= totalSections; sectionId++) {
                const sectionNames = [
                    'Opening & Introduction',
                    'Root Cause Analysis',
                    'Corrective Actions',
                    'Preventive Measures',
                    'Closing & Signature'
                ];
                
                const sectionName = sectionNames[sectionId - 1];
                const progress = Math.floor(((sectionId - 1) / totalSections) * 100);
                
                setGenerationStatus(`Generating ${sectionName}... (${sectionId}/${totalSections})`);
                setGenerationProgress(progress);
                
                console.log(`🔄 Requesting section ${sectionId}: ${sectionName}`);
                
                const response = await fetch('/api/generate-appeal-section', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sectionId: sectionId,
                        formData: formData,
                        previousSections: sections, // Pass previously generated sections for context
                    }),
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Failed to generate section ${sectionId}`);
                }
                
                const data = await response.json();
                
                if (!data.success || !data.sectionText) {
                    throw new Error(`Invalid response for section ${sectionId}`);
                }
                
                console.log(`✅ Received section ${sectionId}: ${data.characterCount} characters`);
                
                // Add the section text
                sections.push(data.sectionText);
                
                // Update the streamed text to show progressive generation
                setStreamedText(sections.join('\n\n'));
                
                // Update progress
                const newProgress = Math.floor((sectionId / totalSections) * 95); // 95% for generation
                setGenerationProgress(newProgress);
            }
            
            // All sections generated, combine them
            const fullAppealText = sections.join('\n\n');
            
            setGenerationStatus('Saving to database...');
            setGenerationProgress(98);
            
            // Save the complete appeal to database
            const saveResponse = await fetch('/api/save-appeal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formData: formData,
                    appealText: fullAppealText,
                }),
            });
            
            if (!saveResponse.ok) {
                console.warn('Failed to save appeal to database, but generation succeeded');
            } else {
                const saveData = await saveResponse.json();
                console.log('✅ Appeal saved with ID:', saveData.appealId);
            }
            
            // Complete!
            setGeneratedAppeal(fullAppealText);
            setGenerationProgress(100);
            setGenerationStatus('Complete! ');
            setCurrentStep(8);
            
            console.log(`🎉 Full appeal generated: ${fullAppealText.length} characters`);
            
        } catch (error: any) {
            console.error('❌ Error generating appeal:', error);
            alert(`Failed to generate appeal: ${error.message}\n\nPlease try again.`);
            setGenerationProgress(0);
            setGenerationStatus('');
            setStreamedText('');
        } finally {
            setIsGenerating(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1: return !!formData.appealType;
            case 2: return !!formData.fullName && !!formData.storeName && !!formData.email;
            case 3: return formData.rootCauses.length > 0 || !!formData.rootCauseDetails;
            case 4: return formData.correctiveActionsTaken.length > 0 || !!formData.correctiveActionsDetails;
            case 5: return formData.preventiveMeasures.length > 0 || !!formData.preventiveMeasuresDetails;
            default: return true;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1_AppealType data={formData} setData={setFormData} />;
            case 2: return <Step2_AccountDetails data={formData} setData={setFormData} />;
            case 3: return <Step3_RootCause data={formData} setData={setFormData} />;
            case 4: return <Step4_CorrectiveActions data={formData} setData={setFormData} />;
            case 5: return <Step5_PreventiveMeasures data={formData} setData={setFormData} />;
            case 6: return <Step6_SupportingDocuments data={formData} setData={setFormData} />;
            case 7: return <Step7_Review 
                data={formData} 
                setData={setFormData} 
                onGenerate={handleGenerate} 
                isGenerating={isGenerating}
                progress={generationProgress}
                status={generationStatus}
                streamedText={streamedText}
            />;
            case 8: return <Step8_GeneratedAppeal data={formData} setData={setFormData} appealText={generatedAppeal} />;
            default: return null;
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-6xl my-8 px-4">{/* Changed from max-w-4xl to max-w-6xl for wider form */}
                {onBackToHome && currentStep === 1 && (
                    <div className="mb-4">
                        <button onClick={onBackToHome} className="text-slate-600 hover:text-slate-800 font-medium text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Home
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-10">
                    <ProgressBar steps={stepNames} currentStepIndex={currentStep - 1} />

                    <div className="min-h-[400px]">
                        {renderStep()}
                    </div>

                    {currentStep < 7 && (
                        <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-center">
                            {currentStep > 1 ? (
                                <button
                                    onClick={handleBack}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-8 rounded-lg transition-colors"
                                >
                                    ← Back
                                </button>
                            ) : <div />}

                            <button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed"
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {currentStep === 8 && (
                        <div className="mt-10 pt-6 border-t border-slate-200 flex justify-center">
                            <button
                                onClick={() => {
                                    setCurrentStep(1);
                                    setFormData(initialFormData);
                                    setGeneratedAppeal('');
                                }}
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                <RefreshIcon className="w-5 h-5" />
                                Start New Appeal
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
