import { useEffect, useState } from 'react';
import { watchJoinRequests } from '@/data';

/** People waiting for a member of this family to let them in. */
export function useJoinRequests(familyId) {
  const [requests, setRequests] = useState([]);
  useEffect(() => watchJoinRequests(familyId, setRequests), [familyId]);
  return requests;
}
