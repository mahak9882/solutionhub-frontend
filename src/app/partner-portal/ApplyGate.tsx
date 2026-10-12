'use client';

import { useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { ChevronDown, ImageUp, X, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import { AmbientEnvironment, useCardGlow, PAGE_BG } from './premium';

const GEOGRAPHY_OPTIONS = [
    'India', 'Middle East (GCC)', 'Southeast Asia', 'Japan',
    'Australia & New Zealand', 'Europe', 'North America', 'Other',
];

const SOLUTION_CATEGORY_OPTIONS = [
    'Data & Analytics', 'AI & Machine Learning', 'Martech', 'Customer Experience (CX)',
    'Cybersecurity', 'Enterprise Software', 'Cloud & Infrastructure', 'Other',
];

const INDUSTRY_OPTIONS = [
    'Airlines', 'Airports', 'Hospitality', 'Logistics & Supply Chain', 'Manufacturing',
    'BFSI', 'Healthcare', 'Telecom', 'Retail', 'Other',
];

const DEPLOYMENT_RANGES = ['1–5', '6–20', '20+'];

const HEAR_ABOUT_OPTIONS = [
    'LinkedIn', 'Referral', 'Direct Outreach', 'Innovation Challenge', 'Platform Tie-up', 'Other',
];

const MAX_WORDS = 50;

const inputCls = "pp-input w-full px-4 py-3 bg-white/90 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";
const inputStyle = { border: '1px solid rgba(15,23,42,0.08)' };
const labelCls = "text-[13px] font-medium text-slate-700 mb-1.5 block";

const selectedChipStyle = {
    background: 'linear-gradient(160deg, #1e293b, #0f172a)',
    boxShadow: '0 8px 18px -8px rgba(15,23,42,0.5), 0 1px 0 rgba(255,255,255,0.12) inset',
};
const chipCls = (selected: boolean) =>
    `pp-chip px-3.5 py-1.5 rounded-full text-xs font-medium border ${
        selected ? 'text-white border-transparent' : 'bg-white/90 text-slate-600 hover:text-slate-900'
    }`;
const chipBorder = (selected: boolean) =>
    selected ? selectedChipStyle : { borderColor: 'rgba(15,23,42,0.1)' };

const toggleBtnCls = (selected: boolean) =>
    `pp-chip flex-1 py-2.5 rounded-xl text-sm font-medium border ${
        selected ? 'text-white border-transparent' : 'bg-white/90 text-slate-600 hover:text-slate-900'
    }`;

// City autocomplete backed by Photon (OpenStreetMap) — free, no API key, fuzzy-matches
// misspellings. Degrades gracefully: if the service is unreachable, this behaves as a
// plain text input, so the field always works.
function HqLocationInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const handleChange = (v: string) => {
        onChange(v);
        if (timer.current) clearTimeout(timer.current);
        if (v.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
        timer.current = setTimeout(async () => {
            try {
                abortRef.current?.abort();
                const ctrl = new AbortController();
                abortRef.current = ctrl;
                const res = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(v.trim())}&limit=6&lang=en&osm_tag=place`,
                    { signal: ctrl.signal },
                );
                if (!res.ok) return;
                const data = await res.json();
                const labels: string[] = [];
                for (const f of data.features || []) {
                    const p = f.properties || {};
                    const label = [p.name, p.state, p.country]
                        .filter(Boolean)
                        .filter((x: string, i: number, a: string[]) => a.indexOf(x) === i)
                        .join(', ');
                    if (label && !labels.includes(label)) labels.push(label);
                }
                setSuggestions(labels.slice(0, 6));
                setOpen(labels.length > 0);
            } catch {
                // network hiccup — silently stay a plain text field
            }
        }, 300);
    };

    const pick = (label: string) => {
        onChange(label);
        setSuggestions([]);
        setOpen(false);
    };

    return (
        <div className="relative">
            <input value={value}
                onChange={e => handleChange(e.target.value)}
                onFocus={() => { if (suggestions.length) setOpen(true); }}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
                placeholder="e.g. Bengaluru, India"
                className={inputCls} style={inputStyle} />
            {open && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl bg-white overflow-hidden"
                    style={{ border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 20px 40px -16px rgba(15,23,42,0.25)' }}>
                    {suggestions.map(s => (
                        <button key={s} type="button"
                            onMouseDown={e => { e.preventDefault(); pick(s); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150">
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function SectionHeader({ step, title, subtitle }: { step: string; title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold"
                style={{
                    background: 'linear-gradient(160deg, #1e293b, #0f172a)',
                    color: '#a5b4fc',
                    boxShadow: '0 8px 20px -8px rgba(15,23,42,0.5), 0 1px 0 rgba(255,255,255,0.12) inset',
                }}>
                {step}
            </div>
            <div>
                <p className="text-[15px] font-semibold text-slate-900 leading-tight tracking-tight">{title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
}

function MultiSelectRow({ label, options, selected, onToggle }: {
    label: string; options: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div>
            <button type="button" onClick={() => setOpen(v => !v)}
                className="pp-input w-full flex items-center justify-between px-4 py-3 bg-white/90 rounded-xl text-sm text-left"
                style={inputStyle}>
                <span className="text-slate-600 font-medium">
                    {label}
                    {selected.length > 0 && <span className="text-slate-900 font-semibold"> ({selected.length} selected)</span>}
                </span>
                <ChevronDown size={15} className={`text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="pp-reveal mt-2 flex flex-wrap gap-2 p-4 rounded-xl"
                    style={{ background: 'linear-gradient(180deg, rgba(248,250,252,0.8), rgba(241,245,249,0.6))', border: '1px solid rgba(15,23,42,0.05)' }}>
                    {options.map(opt => (
                        <button key={opt} type="button" onClick={() => onToggle(opt)}
                            className={chipCls(selected.includes(opt))} style={chipBorder(selected.includes(opt))}>
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ApplyGate({ onSubmitted }: { onSubmitted: () => void }) {
    const { user } = useUser();
    const glow = useCardGlow();

    // Section A — Company Basics
    const [companyName, setCompanyName] = useState('');
    const [website, setWebsite] = useState('');
    const [hqLocation, setHqLocation] = useState('');
    const [contactPerson, setContactPerson] = useState(user?.fullName || '');
    const [contactDesignation, setContactDesignation] = useState('');
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState('');

    // Section B — What You Do
    const [description, setDescription] = useState('');
    const [solutionCategories, setSolutionCategories] = useState<string[]>([]);
    const [industriesServed, setIndustriesServed] = useState<string[]>([]);
    const [geographiesServed, setGeographiesServed] = useState<string[]>([]);

    // Section C — Track Record & Partnership Intent
    const [existingCustomers, setExistingCustomers] = useState('');
    const [enterpriseDeployments, setEnterpriseDeployments] = useState('');
    const [workedWithSI, setWorkedWithSI] = useState<'' | 'true' | 'false'>('');
    const [siDetails, setSiDetails] = useState('');
    const [hearAboutUs, setHearAboutUs] = useState('');
    const [referredBy, setReferredBy] = useState('');

    // Partnership intent extras
    const [partnershipGoal, setPartnershipGoal] = useState('');
    const [expectedContributionVolume, setExpectedContributionVolume] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
        setList(list.includes(value) ? list.filter(x => x !== value) : [...list, value]);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setLogo(file);
        setLogoPreview(file ? URL.createObjectURL(file) : '');
    };

    const descriptionWords = description.trim() ? description.trim().split(/\s+/).length : 0;

    const handleDescriptionChange = (value: string) => {
        const words = value.trim() ? value.trim().split(/\s+/) : [];
        if (words.length <= MAX_WORDS) {
            setDescription(value);
        } else {
            setDescription(words.slice(0, MAX_WORDS).join(' '));
        }
    };

    const submit = async () => {
        setError('');
        if (!companyName.trim() || !contactPerson.trim()) {
            setError('Company name and your name are required.');
            return;
        }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('companyName', companyName.trim());
            fd.append('contactPerson', contactPerson.trim());
            fd.append('contactEmail', user?.primaryEmailAddress?.emailAddress || '');
            if (contactDesignation.trim()) fd.append('contactDesignation', contactDesignation.trim());
            if (website.trim()) fd.append('website', website.trim());
            if (hqLocation.trim()) fd.append('hqLocation', hqLocation.trim());
            if (description.trim()) fd.append('description', description.trim());
            if (solutionCategories.length) fd.append('solutionCategories', JSON.stringify(solutionCategories));
            if (industriesServed.length) fd.append('industriesServed', JSON.stringify(industriesServed));
            if (geographiesServed.length) fd.append('geographiesServed', JSON.stringify(geographiesServed));
            if (existingCustomers.trim()) fd.append('existingCustomers', existingCustomers.trim());
            if (enterpriseDeployments) fd.append('enterpriseDeployments', enterpriseDeployments);
            if (workedWithSI) fd.append('workedWithSI', workedWithSI);
            if (workedWithSI === 'true' && siDetails.trim()) fd.append('siDetails', siDetails.trim());
            if (hearAboutUs) fd.append('hearAboutUs', hearAboutUs);
            if (referredBy.trim()) fd.append('referredBy', referredBy.trim());
            if (partnershipGoal.trim()) fd.append('partnershipGoal', partnershipGoal.trim());
            if (expectedContributionVolume.trim()) fd.append('expectedContributionVolume', expectedContributionVolume.trim());
            if (logo) fd.append('logo', logo);
            await api.post('/api/partners/register', fd);
            onSubmitted();
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen px-6 py-16" style={{ background: PAGE_BG }}>
            <AmbientEnvironment />

            <div className="relative w-full max-w-xl mx-auto">
                <div className="text-center mb-12">
                    <p className="pp-reveal text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 mb-5"
                        style={{ animationDelay: '0.05s' }}>
                        Solution Hub · Partner Accelerator Portal
                    </p>
                    <h1 className="pp-reveal text-[42px] font-semibold tracking-tight text-slate-900 leading-[1.08] mb-4"
                        style={{ animationDelay: '0.14s' }}>
                        Let's build{' '}
                        <span style={{
                            background: 'linear-gradient(100deg, #0f172a 10%, #475569 45%, #6366f1 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            together
                        </span>
                    </h1>
                    <p className="pp-reveal text-sm text-slate-500 max-w-sm mx-auto leading-relaxed" style={{ animationDelay: '0.22s' }}>
                        Tell us about your company — our team reviews every application personally.
                    </p>
                </div>

                <div className="pp-reveal pp-card pp-ring rounded-3xl p-9 space-y-9 bg-white/85"
                    style={{
                        animationDelay: '0.3s',
                        boxShadow: '0 40px 100px -30px rgba(15,23,42,0.28), 0 1px 0 rgba(255,255,255,0.9) inset',
                        border: '1px solid rgba(15,23,42,0.06)',
                    }}
                    onMouseMove={glow}>

                    {/* Section A — Company Basics */}
                    <div className="space-y-4">
                        <SectionHeader step="01" title="Company Basics" subtitle="Who you are" />
                        <div>
                            <label className={labelCls}>Company Name</label>
                            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corp"
                                className={inputCls} style={inputStyle} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Company Website</label>
                                <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://"
                                    className={inputCls} style={inputStyle} />
                            </div>
                            <div>
                                <label className={labelCls}>HQ Location</label>
                                <HqLocationInput value={hqLocation} onChange={setHqLocation} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Your Name</label>
                                <input value={contactPerson} onChange={e => setContactPerson(e.target.value)}
                                    className={inputCls} style={inputStyle} />
                            </div>
                            <div>
                                <label className={labelCls}>Designation</label>
                                <input value={contactDesignation} onChange={e => setContactDesignation(e.target.value)} placeholder="e.g. VP Partnerships"
                                    className={inputCls} style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Company Logo <span className="text-slate-400 font-normal">(for co-marketing use)</span></label>
                            {logoPreview ? (
                                <div className="pp-reveal flex items-center gap-3 px-4 py-3 bg-white/90 rounded-xl" style={inputStyle}>
                                    <img src={logoPreview} alt="Logo preview" className="w-12 h-12 rounded-lg object-contain bg-white shrink-0"
                                        style={{ border: '1px solid rgba(15,23,42,0.08)' }} />
                                    <p className="text-sm text-slate-600 flex-1 truncate font-medium">{logo?.name}</p>
                                    <button type="button" onClick={() => { setLogo(null); setLogoPreview(''); }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0 transition-colors duration-300">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label htmlFor="logo-input"
                                    className="group flex flex-col items-center justify-center w-full rounded-xl border border-dashed cursor-pointer transition-all duration-300 hover:border-indigo-400"
                                    style={{
                                        borderColor: 'rgba(15,23,42,0.14)',
                                        background: 'linear-gradient(180deg, rgba(248,250,252,0.7), rgba(241,245,249,0.5))',
                                        minHeight: 100,
                                    }}>
                                    <input id="logo-input" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5"
                                        style={{ background: 'linear-gradient(145deg, #ffffff, #eef1f6)', boxShadow: '0 8px 18px -8px rgba(15,23,42,0.2), 0 1px 0 rgba(255,255,255,0.9) inset' }}>
                                        <ImageUp size={15} color="#475569" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800">Click to upload your logo</p>
                                    <p className="text-xs text-slate-400 mt-0.5">PNG or JPG, ideally square</p>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="pp-divider" />

                    {/* Section B — What You Do */}
                    <div className="space-y-4">
                        <SectionHeader step="02" title="What You Do" subtitle="Your solutions and reach" />
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[13px] font-medium text-slate-700">Solution Description</label>
                                <span className={`text-xs font-medium transition-colors duration-300 ${descriptionWords >= MAX_WORDS ? 'text-red-500' : 'text-slate-400'}`}>{descriptionWords}/{MAX_WORDS} words</span>
                            </div>
                            <textarea value={description} onChange={e => handleDescriptionChange(e.target.value)} rows={2}
                                placeholder="One line on what your solution does"
                                className={`${inputCls} resize-none`} style={inputStyle} />
                        </div>
                        <MultiSelectRow label="Solution Category" options={SOLUTION_CATEGORY_OPTIONS}
                            selected={solutionCategories} onToggle={v => toggle(solutionCategories, setSolutionCategories, v)} />
                        <MultiSelectRow label="Industries Deployed In" options={INDUSTRY_OPTIONS}
                            selected={industriesServed} onToggle={v => toggle(industriesServed, setIndustriesServed, v)} />
                        <div>
                            <label className={labelCls}>Geographies You Can Deliver In</label>
                            <div className="flex flex-wrap gap-2">
                                {GEOGRAPHY_OPTIONS.map(g => (
                                    <button key={g} type="button" onClick={() => toggle(geographiesServed, setGeographiesServed, g)}
                                        className={chipCls(geographiesServed.includes(g))} style={chipBorder(geographiesServed.includes(g))}>
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pp-divider" />

                    {/* Section C — Track Record & Partnership Intent */}
                    <div className="space-y-4">
                        <SectionHeader step="03" title="Track Record & Intent" subtitle="Experience and goals" />
                        <div>
                            <label className={labelCls}>Reference Clients <span className="text-slate-400 font-normal">(2-3 client names, even one strong logo helps)</span></label>
                            <textarea value={existingCustomers} onChange={e => setExistingCustomers(e.target.value)} rows={2}
                                className={`${inputCls} resize-none`} style={inputStyle} />
                        </div>
                        <div>
                            <label className={labelCls}>Number of Enterprise Deployments</label>
                            <div className="flex gap-2">
                                {DEPLOYMENT_RANGES.map(r => (
                                    <button key={r} type="button" onClick={() => setEnterpriseDeployments(r)}
                                        className={toggleBtnCls(enterpriseDeployments === r)}
                                        style={enterpriseDeployments === r ? selectedChipStyle : { borderColor: 'rgba(15,23,42,0.1)' }}>
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Have you previously worked with an SI or consulting firm?</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setWorkedWithSI('true')}
                                    className={toggleBtnCls(workedWithSI === 'true')}
                                    style={workedWithSI === 'true' ? selectedChipStyle : { borderColor: 'rgba(15,23,42,0.1)' }}>
                                    Yes
                                </button>
                                <button type="button" onClick={() => { setWorkedWithSI('false'); setSiDetails(''); }}
                                    className={toggleBtnCls(workedWithSI === 'false')}
                                    style={workedWithSI === 'false' ? selectedChipStyle : { borderColor: 'rgba(15,23,42,0.1)' }}>
                                    No
                                </button>
                            </div>
                            {workedWithSI === 'true' && (
                                <input value={siDetails} onChange={e => setSiDetails(e.target.value)} placeholder="Which firm?"
                                    className={`${inputCls} mt-2`} style={inputStyle} />
                            )}
                        </div>
                        <div>
                            <label className={labelCls}>How did you hear about us?</label>
                            <select value={hearAboutUs} onChange={e => setHearAboutUs(e.target.value)} className={inputCls} style={inputStyle}>
                                <option value="">Select one</option>
                                {HEAR_ABOUT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        {hearAboutUs === 'Referral' && (
                            <div className="pp-reveal">
                                <label className={labelCls}>Referred By <span className="text-slate-400 font-normal">(comma separated if more than one)</span></label>
                                <input value={referredBy} onChange={e => setReferredBy(e.target.value)} className={inputCls} style={inputStyle} />
                            </div>
                        )}
                        <div>
                            <label className={labelCls}>Partnership Goal</label>
                            <textarea value={partnershipGoal} onChange={e => setPartnershipGoal(e.target.value)} rows={2}
                                placeholder="e.g. co-sell, technology integration, reach new markets"
                                className={`${inputCls} resize-none`} style={inputStyle} />
                        </div>
                        <div>
                            <label className={labelCls}>Expected Contribution Volume</label>
                            <input value={expectedContributionVolume} onChange={e => setExpectedContributionVolume(e.target.value)} placeholder="e.g. 2-3 solutions per quarter"
                                className={inputCls} style={inputStyle} />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div>
                        <button onClick={submit} disabled={submitting}
                            className="pp-btn group w-full flex items-center justify-center gap-2.5 py-3.5 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                            style={{
                                background: 'linear-gradient(160deg, #1e293b, #0f172a)',
                                boxShadow: '0 20px 44px -16px rgba(15,23,42,0.55), 0 0 0 1px rgba(99,102,241,0.14), 0 1px 0 rgba(255,255,255,0.12) inset',
                            }}>
                            <span className="pp-btn-sweep" />
                            {submitting ? 'Submitting…' : 'Submit Application'}
                            {!submitting && <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: '#a5b4fc' }} />}
                        </button>
                        <p className="text-center text-xs text-slate-400 mt-4">We usually respond within a few business days.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
