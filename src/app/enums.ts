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
  OpenMarkdown = 'open-markdown'
}

export const enum MenuId {
  File = 'file',
    FileOpen = 'file_open',
    FileOpenRecent = 'file_open-recent',
    FileExit = 'file_exit',
  Edit = 'edit',
  Application = 'application'
}

export const enum MessageType {
  GetStylesheet = 'get-stylesheet',
  SetActiveStylesheet = 'set-stylesheet'
}

export const enum RendererRequest {
  GetAvailableStylesheets = 'get-stylesheets',
  GetStylesheet = 'get-stylesheet'
}

export const enum RendererEvent {
  ModalClosed = 'modal-closed',
  ModalOpened = 'modal-opened'
}
