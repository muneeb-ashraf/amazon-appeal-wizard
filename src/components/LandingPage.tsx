"use client";
import * as React from 'react';

// --- TYPE DEFINITIONS for PROPS ---

// Defines the types for the props of each SVG icon component
type IconProps = {
    className?: string;
};

// Defines the shape of our form's data
interface FormData {
    issueType: string;
    otherIssueType: string;
    fullName: string;
    email: string;
    businessAddress: string;
    suspensionReason: string;
    cause: string;
    supportingDocuments: string[];
}

// Defines the types for the props of the RadioCard component
type RadioCardProps = {
    id: string;
    name: string;
    value: string;
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

// Defines the types for the props of the CheckboxCard component
type CheckboxCardProps = {
    id: string;
    name: string;
    value: string;
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

// Defines a shared type for the props of each Step component
type StepProps = {
    data: FormData;
    setData: React.Dispatch<React.SetStateAction<FormData>>;
};

// Defines the types for the props of the ProgressBar component
type ProgressBarProps = {
    steps: string[];
    currentStepIndex: number;
};

// Defines the types for the props of the final review step
type ReviewStepProps = {
    data: FormData;
};


// --- SVG ICONS ---
// Using inline SVGs for a self-contained, dependency-free component.

const CheckCircleIcon = ({ className = "w-6 h-6" }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UserIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const MailIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);

const MapPinIcon = ({ className = "w-5 h-5" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

const LockIcon = ({ className = "w-4 h-4" }: IconProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const LogoIcon = ({ className = "h-10 w-auto" }: IconProps) => (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z" fill="url(#paint0_linear_1_2)" />
        <path d="M13 29V11L22 16L27 13.5V23.5L22 26L13 29Z" fill="white" />
        <defs>
            <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563EB" />
                <stop offset="1" stopColor="#4F46E5" />
            </linearGradient>
        </defs>
    </svg>
);


const initialFormData: FormData = {
    issueType: '',
    otherIssueType: '',
    fullName: '',
    email: '',
    businessAddress: '',
    suspensionReason: '',
    cause: '',
    supportingDocuments: [],
};

// --- MULTI-STEP FORM COMPONENTS ---

// Helper component for styled input fields
const StyledInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" />
);

const IconTextarea = ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} rows={props.rows || 4} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"></textarea>
);


// Helper component for radio button cards
const RadioCard = ({ id, name, value, label, checked, onChange }: RadioCardProps) => (
    <label htmlFor={id} className={`relative block p-4 border rounded-lg cursor-pointer transition-all ${checked ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-300 hover:border-indigo-400'}`}>
        <input type="radio" id={id} name={name} value={value} checked={checked} onChange={onChange} className="hidden" />
        <span className="font-semibold text-slate-800">{label}</span>
        {checked && <div className="absolute top-2 right-2 text-indigo-600"><CheckCircleIcon className="w-5 h-5" /></div>}
    </label>
);

// Helper component for checkbox cards
const CheckboxCard = ({ id, name, value, label, checked, onChange }: CheckboxCardProps) => (
    <label htmlFor={id} className={`block p-4 border rounded-lg cursor-pointer transition-all ${checked ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-300 hover:border-indigo-400'}`}>
        <div className="flex items-center">
            <div className={`w-5 h-5 border-2 rounded flex-shrink-0 mr-3 flex items-center justify-center ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="font-semibold text-slate-800">{label}</span>
        </div>
        <input type="checkbox" id={id} name={name} value={value} checked={checked} onChange={onChange} className="hidden" />
    </label>
);

const Step1_IssueType = ({ data, setData }: StepProps) => (
    <div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800">What type of issue are you experiencing?</h2>
        <p className="text-slate-600 mb-8">This will help us guide you to the correct appeal template.</p>
        <div className="space-y-4">
            {['My entire seller account is suspended', 'One or more of my product listings are suspended', 'My funds are being withheld', 'Other issue'].map(issue => (
                <RadioCard
                    key={issue}
                    id={issue}
                    name="issueType"
                    value={issue}
                    label={issue}
                    checked={data.issueType === issue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, issueType: e.target.value })}
                />
            ))}
        </div>
    </div>
);

const Step2_OtherIssue = ({ data, setData }: StepProps) => (
    <div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800">What other issue are you experiencing?</h2>
        <p className="text-slate-600 mb-8">Please select the option that best describes your situation.</p>
        <div className="space-y-4">
            {['Account reactivation issues', 'Brand approval denied', 'Category approval denied', 'Account warning (not suspended yet)', 'Another issue not listed'].map(issue => (
                <RadioCard
                    key={issue}
                    id={issue}
                    name="otherIssueType"
                    value={issue}
                    label={issue}
                    checked={data.otherIssueType === issue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, otherIssueType: e.target.value })}
                />
            ))}
        </div>
    </div>
);

const Step3_SuspensionDetails = ({ data, setData }: StepProps) => (
    <div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800">Tell us about your suspension</h2>
        <p className="text-slate-600 mb-8">Your information is used only to generate your appeal text.</p>
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-2">Amazon Seller Information</h3>
                <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-2">Full Name / Business Name</label>
                    <StyledInput type="text" id="fullName" value={data.fullName} onChange={e => setData({ ...data, fullName: e.target.value })} placeholder="Enter your name or business name" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <StyledInput type="email" id="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="Email associated with Amazon account" />
                </div>
                <div>
                    <label htmlFor="businessAddress" className="block text-sm font-semibold text-slate-700 mb-2">Business Address</label>
                    <StyledInput type="text" id="businessAddress" value={data.businessAddress} onChange={e => setData({ ...data, businessAddress: e.target.value })} placeholder="Your complete business address" />
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-200 pb-2">Suspension Information</h3>
                <div>
                    <label htmlFor="suspensionReason" className="block text-sm font-semibold text-slate-700 mb-2">What reason did Amazon give for the suspension?</label>
                    <IconTextarea id="suspensionReason" value={data.suspensionReason} onChange={e => setData({ ...data, suspensionReason: e.target.value })} rows={5} placeholder="Paste the exact message from Amazon here." />
                    <p className="text-xs text-slate-500 mt-1">Include the exact wording from Amazon's notification email for the best results.</p>
                </div>
                <div>
                    <label htmlFor="cause" className="block text-sm font-semibold text-slate-700 mb-2">What do you believe caused this issue?</label>
                    <IconTextarea id="cause" value={data.cause} onChange={e => setData({ ...data, cause: e.target.value })} rows={5} placeholder="Describe what you think led to the suspension." />
                </div>
            </div>
        </div>
    </div>
);

const Step4_SupportingDocuments = ({ data, setData }: StepProps) => {
    const documents = [
        'Performance Notifications', 'Prior Appeals', 'Product Invoices', 'Supplier Invoices', 'Authorization Letters', 'Other Supporting Documents'
    ];

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        if (checked) {
            setData({ ...data, supportingDocuments: [...data.supportingDocuments, value] });
        } else {
            setData({ ...data, supportingDocuments: data.supportingDocuments.filter(doc => doc !== value) });
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2 text-slate-800">Supporting Documents</h2>
            <p className="text-slate-600 mb-8">Select all documents you can provide. This helps the AI craft a more robust appeal.</p>
            <div className="grid sm:grid-cols-2 gap-4">
                {documents.map(doc => (
                    <CheckboxCard
                        key={doc}
                        id={doc}
                        name="supportingDocuments"
                        value={doc}
                        label={doc}
                        checked={data.supportingDocuments.includes(doc)}
                        onChange={handleCheckboxChange}
                    />
                ))}
            </div>
            <div className="mt-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
                <p className="text-sm text-indigo-800">In the final step, you'll get your appeal letter. You must attach your selected documents when you submit the appeal in Seller Central.</p>
            </div>
        </div>
    );
};

const Step5_Payment = () => (
    <div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800">Complete Your Payment</h2>
        <p className="text-slate-600 mb-8">Securely complete your payment to generate your appeal letter.</p>
        <div className="bg-slate-50 p-6 sm:p-8 border border-slate-200 rounded-lg shadow-inner">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">AmzAppeal Pro Service</h3>
                <p className="text-2xl font-bold text-slate-900">$350.00</p>
            </div>
            <div className="space-y-4">
                <div>
                    <label htmlFor="card-number" className="block text-sm font-semibold text-slate-700 mb-2">Card Number</label>
                    <input type="text" id="card-number" className="w-full p-3 bg-white border border-slate-300 rounded-lg placeholder:text-slate-500" placeholder="•••• •••• •••• 4242" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="expiry" className="block text-sm font-semibold text-slate-700 mb-2">Expiry Date</label>
                        <input type="text" id="expiry" className="w-full p-3 bg-white border border-slate-300 rounded-lg placeholder:text-slate-500" placeholder="MM / YY" />
                    </div>
                    <div>
                        <label htmlFor="cvc" className="block text-sm font-semibold text-slate-700 mb-2">CVC</label>
                        <input type="text" id="cvc" className="w-full p-3 bg-white border border-slate-300 rounded-lg placeholder:text-slate-500" placeholder="•••" />
                    </div>
                </div>
            </div>
            <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center">
                <LockIcon className="w-4 h-4 mr-2" />
                This is a simulated payment form. Your data is not collected.
            </div>
        </div>
    </div>
);

const Step6_ReviewAppeal = ({ data }: ReviewStepProps) => {
    // In a real app, this text would be dynamically generated by an AI based on `data`
    const appealText = `Dear Amazon Seller Performance Team,\n\nMy name is ${data.fullName || '[Your Name/Business Name]'}, and I am the owner of the Amazon seller account associated with the email ${data.email || '[Your Email]'}. I am writing to appeal the suspension of my account.\n\nA. The root cause of the issue\nAfter a thorough review of my account and Amazon's policies, I have identified the root cause of the issue, which was related to: ${data.issueType}. Specifically, ${data.cause || '[A detailed explanation of the root cause based on user input]'}. I take full responsibility for this oversight.\n\nB. The actions you have taken to resolve the issue\nTo resolve this issue, I have taken the following immediate corrective actions:\n- [Action 1: e.g., We have reviewed all customer complaints and issued full refunds.]\n- [Action 2: e.g., We have closed the listings for the ASINs in question.]\n- [Action 3: e.g., We have disposed of all remaining inventory from the problematic supplier.]\n\nC. The steps you have taken to prevent the issue going forward\nTo prevent this issue from recurring, I have implemented the following long-term changes to my business practices:\n- [Preventive Step 1: e.g., We have implemented a new multi-point supplier verification process.]\n- [Preventive Step 2: e.g., We will conduct weekly reviews of our Voice of the Customer dashboard.]\n- [Preventive Step 3: e.g., All staff have completed new training on Amazon's selling policies.]\n\nI am confident that these corrective and preventive actions will ensure my account's full compliance with Amazon's policies moving forward. I have attached the following supporting documents for your review: ${data.supportingDocuments.join(', ') || 'N/A'}.\n\nThank you for your time and consideration.\n\nSincerely,\n${data.fullName || '[Your Name/Business Name]'}`;

    const [copied, setCopied] = React.useState(false);
    const copyToClipboard = () => {
        navigator.clipboard.writeText(appealText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="text-center">
            <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
                <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mt-4 text-slate-800">Your Appeal is Ready!</h2>
            <p className="text-slate-600 mb-6">Your professional Plan of Action is generated. Review it and submit it to Amazon.</p>
            <div className="bg-slate-100 p-4 border border-slate-200 rounded-lg shadow-inner max-h-[40vh] overflow-y-auto text-left">
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">{appealText}</pre>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button onClick={copyToClipboard} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center">
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button onClick={() => alert("Download functionality would be implemented here.")} className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    Download as PDF
                </button>
            </div>
        </div>
    );
};

const FormHeader = ({ onBackToHome }: { onBackToHome?: () => void }) => (
    <div className="text-center mb-10 flex flex-col items-center">
        {onBackToHome && (
            <div className="w-full mb-4">
                <button
                    onClick={onBackToHome}
                    className="text-slate-600 hover:text-slate-800 font-medium text-sm flex items-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Home
                </button>
            </div>
        )}
    </div>
);

const ProgressBar = ({ steps, currentStepIndex }: ProgressBarProps) => (
    <div className="mb-12">
        <div className="flex justify-between items-center">
            {steps.map((step: string, index: number) => (
                <React.Fragment key={step}>
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${index <= currentStepIndex ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                            {index < currentStepIndex ? <CheckCircleIcon className="w-6 h-6" /> : (index + 1)}
                        </div>
                        <p className={`mt-2 text-xs font-semibold transition-colors ${index <= currentStepIndex ? 'text-indigo-600' : 'text-slate-500'}`}>{step}</p>
                    </div>
                    {index < steps.length - 1 && <div className={`flex-1 h-1 mx-2 transition-colors ${index < currentStepIndex ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>}
                </React.Fragment>
            ))}
        </div>
    </div>
);


// --- MAIN APP COMPONENT ---
type LandingPageProps = {
    onBackToHome?: () => void;
};

export default function LandingPage({ onBackToHome }: LandingPageProps) {
    const [currentStep, setCurrentStep] = React.useState(1);
    const [formData, setFormData] = React.useState<FormData>(initialFormData);

    const totalSteps = 6;
    const isOtherIssueFlow = formData.issueType === 'Other issue';

    const stepsConfig = isOtherIssueFlow
        ? [{ id: 1, name: 'Issue' }, { id: 2, name: 'Specify' }, { id: 3, name: 'Details' }, { id: 4, name: 'Documents' }, { id: 5, name: 'Payment' }, { id: 6, name: 'Review' }]
        : [{ id: 1, name: 'Issue' }, { id: 3, name: 'Details' }, { id: 4, name: 'Documents' }, { id: 5, name: 'Payment' }, { id: 6, name: 'Review' }];

    const currentStepConfigIndex = stepsConfig.findIndex(s => s.id === currentStep);

    const handleNext = () => {
        const nextStepIndex = currentStepConfigIndex + 1;
        if (nextStepIndex < stepsConfig.length) {
            setCurrentStep(stepsConfig[nextStepIndex].id);
        }
    };

    const handleBack = () => {
        const prevStepIndex = currentStepConfigIndex - 1;
        if (prevStepIndex >= 0) {
            setCurrentStep(stepsConfig[prevStepIndex].id);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1_IssueType data={formData} setData={setFormData} />;
            case 2: return <Step2_OtherIssue data={formData} setData={setFormData} />;
            case 3: return <Step3_SuspensionDetails data={formData} setData={setFormData} />;
            case 4: return <Step4_SupportingDocuments data={formData} setData={setFormData} />;
            case 5: return <Step5_Payment />;
            case 6: return <Step6_ReviewAppeal data={formData} />;
            default: return null;
        }
    };

    const canProceed = () => {
        if (currentStep === 1) return !!formData.issueType;
        if (currentStep === 2) return !!formData.otherIssueType;
        // Add other validation logic here if needed
        return true;
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 min-h-screen flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 font-sans antialiased">
            {/* IMPORTANT FONT UPGRADE: 
        For the best look, add the 'Inter' font to your project.
        1. In your main CSS file (e.g., globals.css), add:
           @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        2. In your tailwind.config.js, extend the theme:
           theme: {
             extend: {
               fontFamily: {
                 sans: ['Inter', 'sans-serif'],
               },
             },
           },
      */}
            <div className="w-full max-w-3xl my-8">
                <FormHeader onBackToHome={onBackToHome} />
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-10 transition-all duration-300">
                    <ProgressBar steps={stepsConfig.map(s => s.name)} currentStepIndex={currentStepConfigIndex} />

                    <div className="min-h-[300px]">
                        {renderStep()}
                    </div>

                    <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-center">
                        {currentStep > 1 ? (
                            <button onClick={handleBack} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-8 rounded-lg transition-colors">
                                Back
                            </button>
                        ) : (<div />) /* Placeholder for alignment */}

                        {currentStep < totalSteps ? (
                            <button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg disabled:from-slate-400 disabled:to-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                                disabled={!canProceed()}
                            >
                                Next
                            </button>
                        ) : (
                            <button onClick={() => { setCurrentStep(1); setFormData(initialFormData); }} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md hover:shadow-lg">
                                Start Over
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
