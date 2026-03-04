import { Suspense } from 'react';
import RegisterForm from './RegisterForm';

// useSearchParams() in RegisterForm requires a Suspense boundary for static prerendering
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
