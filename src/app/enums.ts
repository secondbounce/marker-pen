export const enum AriaRole {
  AlertDialog = 'alertdialog',
  Dialog = 'dialog'
}

export const enum Channel {
  AppInfo = 'app-info',
  MenuCommand = 'menu-command',
  RendererRequest = 'renderer-request',
  RendererEvent = 'renderer-event'
}

export const enum MenuCommand {
  OpenMarkdown = 'open-markdown',
  SaveAsPdf = 'save-as-pdf'
}

export const enum MenuId {
  File = 'file',
    FileOpen = 'file_open',
    FileOpenRecent = 'file_open-recent',
    SaveAsPdf = 'save_as_pdf',
    FileExit = 'file_exit',
  Edit = 'edit',
  Application = 'application'
}

export const enum MessageType {
  SetActiveStylesheet = 'set-stylesheet',
  TabChanged = 'tab-changed'
}

export const enum RendererRequest {
  GetAvailableStylesheets = 'get-stylesheets',
  GetStylesheet = 'get-stylesheet'
}

export const enum RendererEvent {
  ModalClosed = 'modal-closed',
  ModalOpened = 'modal-opened',
  SaveAsPdf = 'save-as-pdf'
}

export const enum ToolbarControlId {
  OpenDummy = 'open-dummy',
  Stylesheets = 'stylesheets'
}
