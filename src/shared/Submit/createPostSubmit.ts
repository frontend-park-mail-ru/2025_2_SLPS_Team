import { createPost, updatePost } from '../api/postsApi.js';

export type ExistingFileDescriptor = {
  url: string;
};

export type SelectedFile = File | ExistingFileDescriptor;

export interface CreatePostSubmitParams {
  text: string;
  files: SelectedFile[];
  communityId?: number | null;
}

export async function processCreatePostData({
  text,
  files,
  communityId,
}: CreatePostSubmitParams): Promise<void> {
  const formData = new FormData();
  formData.append('text', text);

  for (const file of files) {
    if (file instanceof File) {
      formData.append('photos', file);
    } else if (file.url) {
      const resp = await fetch(file.url);
      const blob = await resp.blob();
      const name = file.url.split('/').pop() ?? 'image.jpg';
      const newFile = new File([blob], name, { type: blob.type });
      formData.append('photos', newFile);
    }
  }

  if (communityId) {
    formData.append('communityID', String(communityId));
  }

  await createPost(formData);
}

export interface UpdatePostSubmitParams {
  text: string;
  selectedFiles: SelectedFile[];
  communityIdFromPost: number | null;
  postId: number;
}

export async function processUpdatePostData({
  text,
  selectedFiles,
  communityIdFromPost,
  postId,
}: UpdatePostSubmitParams): Promise<void> {
  const formData = new FormData();
  formData.append('text', text);

  for (const file of selectedFiles) {
    if (file instanceof File) {
      formData.append('photos', file);
    } else if (file.url) {
      const resp = await fetch(file.url);
      const blob = await resp.blob();
      const name = file.url.split('/').pop() ?? 'image.jpg';
      const newFile = new File([blob], name, { type: blob.type });
      formData.append('photos', newFile);
    }
  }

  if (communityIdFromPost) {
    formData.append('communityID', String(communityIdFromPost));
  }

  await updatePost(postId, formData);
}
