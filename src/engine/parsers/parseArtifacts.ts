import { compact } from 'lodash';

import { ArtifactInterface } from '../../types/Artifact.types';
import {getDirectories, readSourceFile, writeFile} from '../utils/fileUtils';
import { getLocaleSection, parseLocaleData } from './parseLocale';

export function parseArtifacts(version: string, verbose: false) {
  const fileName = `artifactdata_${version}.json`;
  const rawArtifacts = compact(readSourceFile(version, fileName).split(/\n|\r/)).slice(1).join('\n');
  const artifactData = JSON.parse(rawArtifacts);
  const localesDirectories = getDirectories(version, 'sources/locale')
  localesDirectories.forEach((locale: string) => {
    let artifacts = Object.entries(artifactData).reduce<ArtifactInterface[]>((allArtifacts, [, artifact]: [string, any]) => {
      const locales = parseLocale(version, locale);
      const { name, shape, class: classRestriction, id: uuid, description, val } = artifact;
      if (name.includes('MISSING TEXT')) {
        return allArtifacts;
      }
      const localeName = locales?.[uuid]?.nm ?? name;
      const localeDesc = locales?.[uuid]?.txt ?? description;
      const artifactObject = {
        uuid,
        name: localeName,
        class: classRestriction,
        type: shape?.split(' ')?.[0],
        description: localeDesc,
        value: val,
      };

      if (verbose) {
        console.log(artifactObject);
      }

      return [...allArtifacts, artifactObject];
    }, []);

    writeFile(artifacts, version, `artifacts_${locale}`);
  })
}

function parseLocale(version: string, locale: string) {
  const parser = /^art_(\d+)_(\w+)$/;
  const localeData = getLocaleSection(version, `locale/${locale}/dlc`, 'artifacts');
  return parseLocaleData(localeData, parser);
}