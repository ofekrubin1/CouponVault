import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import FamilyActions from '../components/FamilyActions';

export default function Onboarding({ user, joinCode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-10">
      <img src="/icon.svg" alt="" className="mx-auto mb-4 h-16 w-16 rounded-2xl" />
      <h1 className="text-center text-2xl font-extrabold">שלום {user.displayName?.split(' ')[0] || ''} 👋</h1>
      <p className="mb-8 mt-2 text-center text-slate-500">
        קופונים נשמרים בתוך <b>משפחה</b>, וכל החברים בה רואים ומעדכנים אותם.
        <br />
        צור משפחה חדשה או הצטרף לקיימת עם קוד.
      </p>
      <FamilyActions user={user} initialCode={joinCode} />
      <button className="mt-10 text-sm text-slate-400 underline" onClick={() => signOut(auth)}>
        התנתקות ({user.email})
      </button>
    </div>
  );
}
