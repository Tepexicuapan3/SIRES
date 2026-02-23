import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  AdminDetailsDialogFooterControls,
  AdminDetailsDialogSection,
} from "@features/admin/shared/types/details-dialog.types";

export interface AdminDetailsDialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestClose: () => void;
  titleSrOnly: string;
  descriptionSrOnly: string;
  header: ReactNode;
  sections?: AdminDetailsDialogSection[];
  content?: ReactNode;
  topContent?: ReactNode;
  defaultSectionId?: string;
  isLoading?: boolean;
  loadingContent?: ReactNode;
  isError?: boolean;
  errorContent?: ReactNode;
  isDirty?: boolean;
  dialogContentClassName?: string;
  bodyClassName?: string;
  splitBodyClassName?: string;
  sidePanel?: ReactNode;
  sidePanelClassName?: string;
  mainPanelClassName?: string;
  headerClassName?: string;
  scrollAreaClassName?: string;
  contentClassName?: string;
  tabsContainerClassName?: string;
  tabsListClassName?: string;
  tabsTriggerClassName?: string;
  tabsContentClassName?: string;
  showCloseButton?: boolean;
  footer: (controls: AdminDetailsDialogFooterControls) => ReactNode;
  unsavedChangesTitle?: string;
  unsavedChangesDescription?: string;
  unsavedChangesCancelLabel?: string;
  unsavedChangesConfirmLabel?: string;
}

export function AdminDetailsDialogShell({
  open,
  onOpenChange,
  onRequestClose,
  titleSrOnly,
  descriptionSrOnly,
  header,
  sections,
  content,
  topContent,
  defaultSectionId,
  isLoading = false,
  loadingContent = null,
  isError = false,
  errorContent = null,
  isDirty = false,
  dialogContentClassName,
  bodyClassName = "flex max-h-[90vh] min-h-0 flex-col",
  splitBodyClassName = "flex max-h-[90vh] min-h-0",
  sidePanel,
  sidePanelClassName = "hidden w-[300px] shrink-0 border-r border-line-struct/70 bg-subtle/20 lg:flex",
  mainPanelClassName,
  headerClassName = "px-8 pt-8",
  scrollAreaClassName = "min-h-0 flex-1 px-8 pb-8",
  contentClassName = "min-w-0 space-y-6 pt-3",
  tabsContainerClassName,
  tabsListClassName,
  tabsTriggerClassName,
  tabsContentClassName,
  showCloseButton = true,
  footer,
  unsavedChangesTitle = "Salir sin guardar",
  unsavedChangesDescription = "Tienes cambios sin guardar. Si sales ahora, perderas la informacion capturada en este formulario.",
  unsavedChangesCancelLabel = "Editar",
  unsavedChangesConfirmLabel = "Salir",
}: AdminDetailsDialogShellProps) {
  const resolvedDialogContentClassName = cn(
    "h-auto max-h-[90vh] w-[86vw] max-w-none rounded-3xl bg-paper p-0 sm:max-w-[880px]",
    dialogContentClassName,
  );

  const visibleSections = (sections ?? []).filter((section) => !section.hidden);
  const hasTabs = visibleSections.length > 1;

  const resolvedDefaultSectionId =
    (defaultSectionId &&
      visibleSections.find((section) => section.id === defaultSectionId)?.id) ||
    visibleSections[0]?.id ||
    "";

  const [activeSection, setActiveSection] = useState<string>(
    resolvedDefaultSectionId,
  );
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const selectedSection = visibleSections.some(
    (section) => section.id === activeSection,
  )
    ? activeSection
    : resolvedDefaultSectionId;

  const closeDialog = () => {
    setActiveSection(resolvedDefaultSectionId);
    setConfirmCloseOpen(false);
    onRequestClose();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (isDirty) {
        setConfirmCloseOpen(true);
        return;
      }

      closeDialog();
      return;
    }

    setConfirmCloseOpen(false);
    setActiveSection(resolvedDefaultSectionId);
    onOpenChange(true);
  };

  const renderDialogBody = () => {
    if (isLoading) return loadingContent;
    if (isError) return errorContent;

    const detailsContent = (() => {
      if (visibleSections.length === 0) {
        return content;
      }

      if (!hasTabs) {
        return visibleSections[0]?.content;
      }

      return (
        <Tabs
          value={selectedSection}
          onValueChange={setActiveSection}
          className={cn("w-full", tabsContainerClassName)}
        >
          <div className="w-full">
            <TabsList
              className={cn(
                "w-full gap-1.5 rounded-2xl border border-line-struct/60 bg-subtle/30 p-1.5",
                tabsListClassName,
              )}
            >
              {visibleSections.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  disabled={section.disabled}
                  className={cn(
                    "h-9 flex-1 gap-2 rounded-xl px-3 text-sm font-semibold text-txt-muted shadow-none transition-colors hover:text-txt-body data-[state=active]:bg-paper data-[state=active]:text-txt-body data-[state=active]:shadow-sm",
                    tabsTriggerClassName,
                  )}
                >
                  {section.icon}
                  {section.label}
                  {section.badge}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {visibleSections.map((section) => (
            <TabsContent
              key={section.id}
              value={section.id}
              className={cn("pt-4", tabsContentClassName)}
            >
              {section.content}
            </TabsContent>
          ))}
        </Tabs>
      );
    })();

    if (!topContent) {
      return detailsContent;
    }

    return (
      <div className="space-y-1">
        {topContent}
        {detailsContent}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className={resolvedDialogContentClassName}
        showCloseButton={showCloseButton}
      >
        {sidePanel ? (
          <div className={splitBodyClassName}>
            <aside className={sidePanelClassName}>{sidePanel}</aside>
            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col",
                mainPanelClassName,
              )}
            >
              <DialogHeader className={headerClassName}>
                <DialogTitle className="sr-only">{titleSrOnly}</DialogTitle>
                <DialogDescription className="sr-only">
                  {descriptionSrOnly}
                </DialogDescription>
                {header}
              </DialogHeader>

              <ScrollArea className={scrollAreaClassName}>
                <div className={contentClassName}>{renderDialogBody()}</div>
              </ScrollArea>

              {footer({ onCancel: () => handleDialogOpenChange(false) })}
            </div>
          </div>
        ) : (
          <div className={bodyClassName}>
            <DialogHeader className={headerClassName}>
              <DialogTitle className="sr-only">{titleSrOnly}</DialogTitle>
              <DialogDescription className="sr-only">
                {descriptionSrOnly}
              </DialogDescription>
              {header}
            </DialogHeader>

            <ScrollArea className={scrollAreaClassName}>
              <div className={contentClassName}>{renderDialogBody()}</div>
            </ScrollArea>

            {footer({ onCancel: () => handleDialogOpenChange(false) })}
          </div>
        )}
      </DialogContent>

      <AlertDialog
        open={open && confirmCloseOpen}
        onOpenChange={setConfirmCloseOpen}
      >
        <AlertDialogContent
          size="sm"
          className="overflow-hidden rounded-2xl border-line-struct/60 bg-paper p-0 shadow-modal data-[size=sm]:max-w-sm"
        >
          <AlertDialogHeader className="px-6 pt-6 pb-5 sm:!place-items-center sm:!text-center">
            <AlertDialogTitle>{unsavedChangesTitle}</AlertDialogTitle>
            <AlertDialogDescription className="max-w-sm text-center text-txt-muted">
              {unsavedChangesDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!grid !grid-cols-2 gap-3 border-t border-line-struct/60 bg-subtle/30 px-4 py-4 sm:!grid sm:!grid-cols-2 sm:space-x-0">
            <AlertDialogCancel className="mt-0 w-full rounded-xl border-line-struct/70 bg-subtle/60 hover:bg-subtle">
              {unsavedChangesCancelLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="default"
              className="w-full rounded-xl"
              onClick={() => {
                setConfirmCloseOpen(false);
                closeDialog();
              }}
            >
              {unsavedChangesConfirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
