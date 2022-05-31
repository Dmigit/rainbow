import { useQuery } from 'react-query';
import {
  getResolveName,
  saveResolveName,
} from '@rainbow-me/handlers/localstorage/ens';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { queryClient } from '@rainbow-me/react-query/queryClient';

export const ensResolveNameQueryKey = (ensName: string) => [
  'resolve-name',
  ensName,
];

export async function prefetchENSResolveName(ensName: string) {
  await queryClient.prefetchQuery(ensResolveNameQueryKey(ensName), async () =>
    web3Provider.resolveName(ensName)
  );
}

export default function useENSResolveName(ensName: string) {
  return useQuery(ensResolveNameQueryKey(ensName), async () => {
    const cachedAddress = await getResolveName(ensName);
    if (cachedAddress) return cachedAddress;

    const address = await web3Provider.resolveName(ensName);
    address && saveResolveName(ensName, address);
    return address;
  });
}
