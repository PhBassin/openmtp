import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import classNames from 'classnames';
import { niceBytes } from '../../../utils/funcs';
import MiddleEllipsis from '../../../components/MiddleEllipsis';
import { styles } from '../styles/FileExplorerTableBodyListRender';
// eslint-disable-next-line import/no-relative-packages
import prettyFileIcons from '../../../vendors/pretty-file-icons';
import { imgsrc } from '../../../utils/imgsrc';
import { appDateFormat } from '../../../utils/date';

class FileExplorerTableBodyListRender extends PureComponent {
  RenderFileIcon = () => {
    const { classes: styles, item } = this.props;

    const fileIcon = prettyFileIcons.getIcon(item.name, 'svg');

    return (
      <div className={styles.fileTypeIconWrapper}>
        <img
          src={imgsrc(`file-types/${fileIcon}`)}
          alt={item.name}
          className={classNames(styles.fileTypeIcon)}
        />
      </div>
    );
  };

  RenderFolderIcon = () => {
    const { classes: styles, item } = this.props;

    return (
      <div className={styles.fileTypeIconWrapper}>
        <img
          src={imgsrc(`FileExplorer/folder-blue.svg`)}
          alt={item.name}
          className={classNames(styles.fileTypeIcon)}
        />
      </div>
    );
  };

  render() {
    const {
      classes: styles,
      isSelected,
      item,
      deviceType,
      _eventTarget,
      tableData,
      hideColList,
      onContextMenuClick,
      onTableClick,
      onTableDoubleClick,
    } = this.props;

    const { RenderFileIcon, RenderFolderIcon } = this;

    return (
      <TableRow
        draggable
        hover
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={-1}
        selected={isSelected}
        className={classNames({
          [styles.tableRowSelected]: isSelected,
        })}
        onDragStart={(event) => {
          if (!isSelected) {
            onTableClick(item.path, deviceType, event);
          }
        }}
      >
        <TableCell
          padding="none"
          className={`${styles.tableCell} checkboxCell`}
          onContextMenu={(event) =>
            onContextMenuClick(
              event,
              { ...item },
              { ...tableData },
              _eventTarget
            )
          }
        >
          <Checkbox
            checked={isSelected}
            onClick={(event) => onTableClick(item.path, deviceType, event)}
          />
        </TableCell>
        {hideColList.indexOf('name') < 0 && (
          <TableCell
            padding="default"
            onClick={(event) => onTableClick(item.path, deviceType, event)}
            className={`${styles.tableCell} nameCell`}
            onContextMenu={(event) =>
              onContextMenuClick(
                event,
                { ...item },
                { ...tableData },
                _eventTarget
              )
            }
            onDoubleClick={(event) =>
              onTableDoubleClick(item, deviceType, event)
            }
          >
            <div className={styles.nameCellInner}>
              {item.isFolder ? <RenderFolderIcon /> : <RenderFileIcon />}
              <MiddleEllipsis
                text={item.name}
                className={styles.fileName}
                tooltipPlacement="bottom-start"
              />
            </div>
          </TableCell>
        )}
        {hideColList.indexOf('size') < 0 && (
          <TableCell
            padding="none"
            onClick={(event) => onTableClick(item.path, deviceType, event)}
            className={`${styles.tableCell} sizeCell`}
            onContextMenu={(event) =>
              onContextMenuClick(
                event,
                { ...item },
                { ...tableData },
                _eventTarget
              )
            }
            onDoubleClick={(event) =>
              onTableDoubleClick(item, deviceType, event)
            }
          >
            {item.isFolder ? `--` : `${niceBytes(item.size)}`}
          </TableCell>
        )}
        {hideColList.indexOf('dateAdded') < 0 && (
          <TableCell
            padding="none"
            onClick={(event) => onTableClick(item.path, deviceType, event)}
            className={`${styles.tableCell} dateAddedCell`}
            onContextMenu={(event) =>
              onContextMenuClick(
                event,
                { ...item },
                { ...tableData },
                _eventTarget
              )
            }
            onDoubleClick={(event) =>
              onTableDoubleClick(item, deviceType, event)
            }
          >
            {appDateFormat(item.dateAdded)}
          </TableCell>
        )}
      </TableRow>
    );
  }
}

export default withStyles(styles)(FileExplorerTableBodyListRender);
