import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import App from './App';

// Keep the black native launch screen until the centered logo is ready to fade in.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: false });
registerRootComponent(App);
