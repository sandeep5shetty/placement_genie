import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { profileHasDetails } from "@/lib/placement/extract-heuristic";
import { extractProfileFromResumeText } from "@/lib/placement/extract-skills";
import {
  extractResumeText,
  isSupportedResumeFile,
} from "@/lib/placement/parse-resume";

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Failed to extract the profile from the resume.";
}

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
        {
          error:
            "Could not read text from that PDF. If it is a scanned image, export it as a text PDF or DOCX.",
        },
        { status: 400 }
      );
    }

    const profile = await extractProfileFromResumeText(text);

    if (!profileHasDetails(profile)) {
      return NextResponse.json(
        {
          error:
            "Read the file but found no USN, name, CGPA, or skills. Fill the profile fields manually.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
