import { useFeedModel } from './feed.model';
import FeedView from './feed.view';

export default function FeedPage() {
  const props = useFeedModel();
  return <FeedView {...props} />;
}
