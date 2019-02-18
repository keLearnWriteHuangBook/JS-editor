const gutterWidth = 60

export default {
  isActive: false,
  fontSize: 14,
  lineHeight: 20,
  theme: {
    background: 'rgba(0, 0, 0, 0.9)',
    color: '#fff'
  },
  gutterWidth,
  scrollThickness: 10,
  rollRange: 15,
  tabBlank: 2,
  editorInfo: {},
  startPos: null,
  endPos: null,
  selectStatus: false,
  contentInfo: {
    height: 0,
    width: 0,
    maxWidthLine: null,
    rightGap: 20, //右边的空隙
  },
  cursorInfo: {
    left: gutterWidth,
    top: 0,
    cursorStrIndex: 0,
    cursorLineIndex: 0
  },
  textSnapShot: [],
  cursorSnapShot: []
}
