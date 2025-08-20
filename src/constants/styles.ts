// Optimized styles and constants for production
export const MODAL_STYLES = {
  dialog: {
    borderRadius: 2,
    overflow: 'hidden'
  },
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid',
    borderColor: 'grey.200',
    py: 3,
    px: 4
  },
  content: {
    p: 4,
    backgroundColor: 'white'
  },
  card: {
    mb: 4,
    border: '1px solid',
    borderColor: 'grey.100'
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }
} as const;

export const METRIC_CARD_STYLES = {
  card: {
    textAlign: 'center' as const,
    border: '1px solid',
    borderColor: 'grey.100'
  },
  content: {
    p: 2.5
  },
  number: {
    color: 'text.primary',
    fontWeight: 700,
    mb: 0.5,
    fontSize: '2rem'
  },
  label: {
    color: 'text.secondary',
    fontWeight: 500
  }
} as const;

export const INFO_ROW_STYLES = {
  container: {
    py: 2,
    borderBottom: '1px solid',
    borderColor: 'grey.100',
    '&:last-child': { borderBottom: 'none' }
  },
  labelContainer: {
    minWidth: 180,
    display: 'flex',
    alignItems: 'center',
    pr: 3
  },
  label: {
    fontWeight: 600,
    color: 'text.primary',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  value: {
    color: 'text.primary',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }
} as const;

export const TABLE_CONFIG = {
  rowsPerPageOptions: [5, 10, 25, 50],
  defaultRowsPerPage: 10,
  maxHeight: 600
} as const;