# Dukkantek POS Clone (Flutter)

A production-ready, touch-optimized Point of Sale (POS) system built with Flutter, designed to clone the features of Dukkantek for the Oman market.

## Features

- **Touch-Optimized UI**: Large buttons, swipe gestures, and responsive grid layout perfect for tablets (iPad/Android) and web.
- **POS Terminal**:
  - Split-screen view (Products + Cart).
  - Fast product search & category filtering.
  - Quick "Add to Cart" with touch.
  - **Oman VAT (5%)** automatic calculation.
- **Authentication**:
  - Role-based access (Admin, Cashier).
  - **PIN Login** for fast staff switching.
- **Dashboard**:
  - Live sales overview.
  - Interactive charts (Weekly Revenue).
- **Architecture**:
  - **Riverpod** for robust state management.
  - **Material 3** Design System.
  - Dark/Light mode support.

## Getting Started

### Prerequisites

- Flutter SDK (3.0+)
- Dart SDK

### Installation

1.  **Navigate to the project directory:**
    ```bash
    cd dukkantek_pos_flutter
    ```

2.  **Install dependencies:**
    ```bash
    flutter pub get
    ```

3.  **Configure Firebase:**
    This project uses a placeholder `firebase_options.dart`. To connect your own Firebase project:
    
    ```bash
    # Install FlutterFire CLI if you haven't
    dart pub global activate flutterfire_cli

    # Configure project
    flutterfire configure
    ```
    Select your project and platforms (check Web, Android, iOS). This will overwrite `lib/firebase_options.dart` with your actual keys.

4.  **Run the App:**
    ```bash
    flutter run -d chrome  # For Web
    # OR
    flutter run -d ipad    # For iPad Simulator
    ```

## Project Structure

- `lib/main.dart`: Entry point & Theme config.
- `lib/screens/`: UI screens (Login, Dashboard, POS).
- `lib/providers/`: Riverpod state providers (Cart, Auth).
- `lib/models/`: Data models (Product, CartItem).
- `lib/services/`: Business logic (Auth, Firestore).

## Tech Stack

- **Framework**: Flutter
- **Backend**: Firebase (Auth, Firestore)
- **State**: Flutter Riverpod
- **Charts**: fl_chart
- **Icons**: FontAwesome & Material Icons
