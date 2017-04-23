class AppError extends Error {
  constructor( layer, message, props, parent ) {
    super( message );
    this.message = message;
    this.layer = layer;
    this.props = props;
    this.parent = parent;
  }
}

export default AppError;