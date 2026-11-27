export const tableCellFileExplorerTableRowsRender = {
  borderBottom: `unset`,
  [`&.checkboxCell`]: {
    width: 50,
  },
  [`&.nameCell`]: {
    // `width: 100%` + `maxWidth: 0` lets the name column take all the
    // remaining width of the table while size/date keep their content width
    width: `100%`,
    maxWidth: 0,
    whiteSpace: `nowrap`,
    overflow: `hidden`,
  },
  [`&.sizeCell`]: {
    whiteSpace: `nowrap`,
    overflow: `hidden`,
    textOverflow: `ellipsis`,
    width: `auto`,
    minWidth: 100,
  },
  [`&.dateAddedCell`]: {
    whiteSpace: `nowrap`,
    overflow: `hidden`,
    textOverflow: `ellipsis`,
    width: `auto`,
    minWidth: 100,
    paddingRight: 10,
  },
};

export const styles = (_) => {
  return {
    tableRowSelected: {
      backgroundColor: 'rgba(41, 121, 255, 0.15) !important',
    },
    tableCell: tableCellFileExplorerTableRowsRender,
    fileTypeIconWrapper: {
      flexShrink: 0,
      paddingTop: 5,
      paddingBottom: 5,
      paddingLeft: 2,
      textAlign: 'center',
    },
    fileTypeIcon: {
      verticalAlign: `middle`,
      height: 20,
      width: 'auto',
    },
    nameCellInner: {
      display: 'flex',
      alignItems: 'center',
      minWidth: 0,
    },
    fileName: {
      flex: '1 1 0',
      minWidth: 0,
      marginLeft: 8,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    },
  };
};
