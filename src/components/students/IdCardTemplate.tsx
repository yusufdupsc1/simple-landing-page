"use client";

import { School, Phone, Mail, Calendar, User, QrCode } from "lucide-react";

interface StudentData {
  firstName: string;
  lastName: string;
  studentId: string;
  dateOfBirth?: Date | string | null;
  phone?: string | null;
  email?: string | null;
  joinDate?: Date | string | null;
  expireDate?: Date | string | null;
  className?: string;
  photo?: string | null;
  gender?: string;
}

interface InstitutionData {
  name: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface IdCardTemplateProps {
  student: StudentData;
  institution: InstitutionData;
  signatureName?: string;
  signatureTitle?: string;
  className?: string;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function WaveDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className={`absolute left-0 right-0 h-3 ${flip ? "bottom-0" : "top-0"}`}
    >
      <svg
        viewBox="0 0 400 12"
        preserveAspectRatio="none"
        className="absolute w-full h-full"
        style={{ fill: "#006a4e" }}
      >
        <path d="M0,12 L0,6 C50,12 100,0 150,6 C200,12 250,0 300,6 C350,12 400,0 400,6 L400,12 Z" />
      </svg>
    </div>
  );
}

export function IdCardTemplate({
  student,
  institution,
  signatureName = "Principal",
  signatureTitle = "Head Teacher",
  className = "",
}: IdCardTemplateProps) {
  const fullName = `${student.firstName} ${student.lastName}`;
  const roleLabel = student.className ? "Student" : "Student";

  return (
    <div className={`flex flex-col gap-8 ${className}`}>
      {/* Front Side */}
      <div className="relative w-[375px] h-[550px] bg-white rounded-[15px] shadow-lg overflow-hidden border border-border/50">
        {/* Top Wave */}
        <WaveDivider />

        {/* Header */}
        <div className="absolute top-3 left-0 right-0 h-16 bg-[#0f172a] flex items-center justify-center px-4 z-10">
          <div className="text-center">
            <p className="text-white font-bold text-sm tracking-wide">
              {institution.name}
            </p>
            {institution.tagline && (
              <p className="text-slate-300 text-[10px]">
                {institution.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Profile Section */}
        <div className="pt-24 px-4 flex flex-col items-center">
          {/* Photo Placeholder */}
          <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden mb-3">
            {student.photo ? (
              <img
                src={student.photo}
                alt={`${fullName} photo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-slate-400" />
            )}
          </div>

          {/* Name */}
          <h2 className="text-lg font-bold text-center text-slate-800 mb-1">
            {fullName}
          </h2>

          {/* Role */}
          <p className="text-xs text-slate-500 mb-4">{roleLabel}</p>
        </div>

        {/* Info Fields */}
        <div className="px-5 py-2 space-y-2">
          <InfoRow label="ID No" value={student.studentId} />
          <InfoRow
            label="Date of Birth"
            value={formatDate(student.dateOfBirth)}
          />
          <InfoRow label="Phone" value={student.phone || "N/A"} />
          <InfoRow label="Email" value={student.email || "N/A"} />
          <InfoRow label="Join Date" value={formatDate(student.joinDate)} />
          <InfoRow label="Expire Date" value={formatDate(student.expireDate)} />
        </div>

        {/* Bottom Wave */}
        <WaveDivider flip />

        {/* Footer Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#0f172a] flex items-center justify-center">
          <p className="text-white text-[10px] font-medium">
            {institution.name}
          </p>
        </div>
      </div>

      {/* Back Side */}
      <div className="relative w-[375px] h-[550px] bg-white rounded-[15px] shadow-lg overflow-hidden border border-border/50">
        {/* Top Wave */}
        <WaveDivider />

        {/* Header */}
        <div className="absolute top-3 left-0 right-0 h-12 bg-[#0f172a] flex items-center justify-center px-4 z-10">
          <p className="text-white font-bold text-sm">Terms & Conditions</p>
        </div>

        {/* Content */}
        <div className="pt-20 px-5">
          {/* Terms */}
          <div className="mb-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              This ID card is the property of {institution.name}. It is
              non-transferable and must be returned upon termination of
              enrollment. The holder agrees to abide by all school rules and
              regulations. Lost cards must be reported immediately.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone className="w-3.5 h-3.5" />
              <span>{institution.phone || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Mail className="w-3.5 h-3.5" />
              <span>{institution.email || "N/A"}</span>
            </div>
            {institution.address && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <School className="w-3.5 h-3.5" />
                <span>{institution.address}</span>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="flex justify-between text-xs mb-6 px-2">
            <div>
              <p className="text-slate-500">Join Date</p>
              <p className="font-medium text-slate-700">
                {formatDate(student.joinDate)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Expire Date</p>
              <p className="font-medium text-slate-700">
                {formatDate(student.expireDate)}
              </p>
            </div>
          </div>

          {/* Signature and QR */}
          <div className="flex justify-between items-end mt-8">
            {/* Signature */}
            <div className="w-32">
              <div className="border-b border-slate-300 h-8 mb-1"></div>
              <p className="text-[10px] text-slate-500 italic">Manager Sign</p>
              <p className="text-[9px] text-slate-400">{signatureTitle}</p>
            </div>

            {/* QR Code Placeholder */}
            <div className="w-20 h-20 border-2 border-dashed border-slate-200 rounded flex items-center justify-center bg-slate-50">
              <QrCode className="w-8 h-8 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <WaveDivider flip />

        {/* Footer Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#0f172a] flex items-center justify-center">
          <p className="text-white text-[10px] font-medium">
            {institution.name}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-700">{value}</span>
    </div>
  );
}

export default IdCardTemplate;
