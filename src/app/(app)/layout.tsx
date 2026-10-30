import { StudyBroProvider } from "@/lib/store/studybro-store";
import { WorkspaceProvider } from "@/lib/store/workspace-store";
import { AppShell } from "@/components/layout/AppShell";
import { CameraProvider } from "@/components/camera/CameraProvider";
import { InterventionHost } from "@/components/alerts/InterventionHost";
import { ToastHost } from "@/components/alerts/AlertToast";
import { CoachHost } from "@/components/coach/CoachHost";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <StudyBroProvider>
        <CameraProvider>
          <AppShell>{children}</AppShell>
          <ToastHost />
          <InterventionHost />
          <CoachHost />
        </CameraProvider>
      </StudyBroProvider>
    </WorkspaceProvider>
  );
}
