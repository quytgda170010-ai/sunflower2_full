import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock Keycloak
jest.mock('@react-keycloak/web', () => ({
  useKeycloak: () => ({
    keycloak: {
      authenticated: false,
      token: null,
      tokenParsed: null,
    },
    isLoading: false,
  }),
  ReactKeycloakProvider: ({ children }) => <div>{children}</div>,
}));

describe('App Component', () => {
  test('renders login page when not authenticated', () => {
    render(<App />);
    expect(screen.getByText(/EHR Admin Dashboard/i)).toBeInTheDocument();
  });

  test('renders login button', () => {
    render(<App />);
    expect(screen.getByText(/Login with Keycloak/i)).toBeInTheDocument();
  });
});

