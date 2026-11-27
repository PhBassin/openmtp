import { mixins } from '../../../styles/js';

// The file name is wrapped on up to 3 lines below the icon, then truncated
// in the middle. The line height is tightened so that 3 lines still fit in
// the unchanged grid cell height.
export const GRID_FILE_NAME_MAX_LINES = 3;
const GRID_FILE_NAME_LINE_HEIGHT = 1.2;

export const styles = (theme) => ({
  wrapper: {},
  itemWrapper: {
    float: `left`,
    width: 100,
    height: 137,
  },
  itemCheckBox: {
    display: `none`,
  },
  fileTypeIcon: {
    width: 'auto',
    height: 80,
  },
  fileTypeIconWrapper: {
    ...mixins({ theme }).center,
    paddingTop: 10,
    paddingBottom: 10,
    textAlign: 'center',
  },
  itemSelected: {
    backgroundColor: 'rgba(41, 121, 255, 0.15) !important',
  },
  itemFileName: {
    display: `block`,
    wordBreak: `break-all`,
    textAlign: `center`,
    lineHeight: GRID_FILE_NAME_LINE_HEIGHT,
  },
  itemFileNameText: {
    display: `-webkit-box`,
    WebkitBoxOrient: `vertical`,
    WebkitLineClamp: GRID_FILE_NAME_MAX_LINES,
    overflow: `hidden`,
    maxHeight: `${GRID_FILE_NAME_MAX_LINES * GRID_FILE_NAME_LINE_HEIGHT}em`,
  },
  itemFileNameWrapper: {
    marginLeft: 12,
    marginRight: 12,
    marginTop: -8,
    textAlign: `center`,
  },
});
