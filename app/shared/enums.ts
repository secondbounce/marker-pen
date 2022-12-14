export const enum Channel {
  AppInfo = 'app-info',
  MenuCommand = 'menu-command',
  RendererRequest = 'renderer-request',
  RendererEvent = 'renderer-event',
  Settings = 'settings'
}

export const enum MenuCommand {
  OpenMarkdown = 'open-markdown',
  SaveAsPdf = 'save-as-pdf',
  Settings = 'show-settings',
  SetStylesheet = 'set-stylesheet'
}

export const enum MenuId {
  File = 'file',
    FileOpen = 'file_open',
    FileOpenRecent = 'file_open-recent',
    FileOpenRecentItem = 'file_open-recent_recent',
    FileOpenRecentClear = 'file_open-recent_clear',
    SaveAsPdf = 'file_save-as-pdf',
    Settings = 'file_settings',
    FileExit = 'file_exit',
  Edit = 'edit',
  Application = 'application'
}

export const enum RendererRequest {
  GetStylesheet = 'get-stylesheet',
  SelectStylesheet = 'select-stylesheet'
}

export const enum RendererEvent {
  ModalClosed = 'modal-closed',
  ModalOpened = 'modal-opened',
  SaveAsPdf = 'save-as-pdf',
  StateChanged = 'state-changed'
}

export const enum SettingKey {
  /* These values are the JSON keys into the settings file */
  All = '',
  DefaultStylesheet = 'defaultStylesheet',
  PdfFormat = 'pdfFormat',
  RecentlyOpened = 'recentlyOpened',
  Stylesheets = 'stylesheets'
}
