const renderTooltip = (props, text) => (
    // <Tooltip id="button-tooltip" {...props}>
    //   Simple tooltip
    // </Tooltip>
      <div
      {...props}
      style={{
        position: 'absolute',
        backgroundColor: 'rgba(53, 56, 64, 0.85)',
        padding: '2px 10px',
        color: 'white',
        borderRadius: 3,
        ...props.style,
      }}
    >
      {text}
    </div>
  );

export {renderTooltip}