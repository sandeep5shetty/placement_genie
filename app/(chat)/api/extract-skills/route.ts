import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { extractProfileFromResumeText } from "@/lib/placement/extract-skills";
import {
  extractResumeText,
  isSupportedResumeFile,
} from "@/lib/placement/parse-resume";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Attach a PDF or DOCX resume." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Resume must be smaller than 5MB." },
        { status: 400 }
      );
    }

    if (!isSupportedResumeFile(file)) {
      return NextResponse.json(
        { error: "Only PDF and DOCX resumes are supported." },
        { status: 400 }
      );
    }

    const text = (await extractResumeText(file)).trim();

    if (!text) {
      return NextResponse.json(
        { error: "Could not read any text from that resume." },
        { status: 400 }
      );
    }

    const profile = await extractProfileFromResumeText(text);

    if (profile.skills.length === 0 && !profile.cgpa && !profile.name) {
      return NextResponse.json(
        { error: "No profile details were found. Fill them in and continue." },
        { status: 422 }
      );
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json(
      { error: "Failed to extract the profile from the resume." },
      { status: 500 }
    );
  }
}
