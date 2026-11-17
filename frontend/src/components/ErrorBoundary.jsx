import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Hook up Sentry / LogRocket etc. here.
    console.error('Unhandled UI error', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container empty-state">
          <h2>Something went wrong</h2>
          <p>We hit an unexpected error. Please refresh the page — your cart is saved.</p>
          <button className="btn btn--primary" onClick={() => window.location.assign('/')}>
            Back to home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
