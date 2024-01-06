import { INewPost, INewUser, IUpdatePost } from "@/types";
import { ID, Query } from "appwrite";
import { account, appwriteConfig, avatars, databases, storage } from "./config";

/**
 * Creates a new user account.
 *
 * @param {INewUser} user - The user object containing the user's information.
 * @return {Promise<User>} - The newly created user account.
 */
export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name,
    );
    if (!newAccount) {
      throw new Error("Failed to create account");
    }
    const avatarUrl = avatars.getInitials(user.name);
    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      username: user.username,
      email: newAccount.email,
      imageUrl: avatarUrl,
    });
    return newUser;
  } catch (error) {
    console.error(error);
    return error;
  }
}
// save to db
export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  username?: string;
  name: string;
  imageUrl: URL;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user,
    );
    return newUser;
  } catch (error) {
    console.error(error);
  }
}

// sign in
export async function signInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailSession(user.email, user.password);
    return session;
  } catch (error) {
    console.error(error);
  }
}
// get account
export async function getAccount() {
  try {
    const currentAccount = await account.get();
    return currentAccount;
  } catch (error) {
    console.log(error);
  }
}
// get user

export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    if (!currentAccount) throw Error;
    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)],
    );
    if (!currentUser) throw Error;
    return currentUser.documents[0];
  } catch (error) {
    console.error(error);
    return null;
  }
}
// sign out
export async function signOutAccount() {
  try {
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    console.error(error);
  }
}

export async function getUsers(limit?: number) {
  const queries = [Query.orderDesc("$createdAt")];
  if (limit) queries.push(Query.limit(limit));
  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries,
    );
    if (!users) throw Error;
    return users;
  } catch (error) {
    console.error(error);
  }
}
// create post
export async function createPost(post: INewPost) {
  try {
    // upload image
    const uploadedFile = await uploadFile(post.file[0]);
    if (!uploadedFile) throw Error;

    // get url file
    const fileUrl = await getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }
    // convert tags to array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];
    //create post
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags,
      },
    );
    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }
    return newPost;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// update post
export async function updatePost(post: IUpdatePost) {
  // console.log(post);
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      // update new file to appwrite storage
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // get new url file
      const fileUrl = await getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    // convert  tags to array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    //update post
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      },
    );
    //failed update
    if (!updatedPost) {
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      throw Error;
    }
    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.imageId);
    }
    return updatedPost;
  } catch (error) {
    console.error(error);
  }
}
// get recent posts
export async function getRecentPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(20)],
    );
    if (!posts) throw Error;
    return posts;
  } catch (error) {
    console.error(error);
  }
}
/**
 * Retrieves the posts created by a specific user.
 *
 * @param {string} userId - The ID of the user.
 * @return {Promise<Array>} An array of post objects created by the user.
 */
export async function getUserPosts(userId: string) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")],
    );
    if (!posts) throw Error;
    return posts;
  } catch (error) {
    console.error(error);
  }
}

export async function deletePost(postId?: string, imageId?: string) {
  if (!postId || !imageId) throw Error;
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
    );

    if (!statusCode) throw Error;

    await deleteFile(imageId);
    return { status: "Ok" };
  } catch (error) {
    console.error(error);
  }
}
export async function searchPosts(query: string) {
  // console.log(query)†
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.search("caption", query)],
    );
    // console.log(posts)
    if (!posts) throw Error;
    return posts;
  } catch (error) {
    console.error(error);
  }
}
export async function getInfinitePosts({ pageParam }: { pageParam?: number }) {
  const queries = [Query.orderDesc("$createdAt"), Query.limit(9)];
  if (pageParam) queries.push(Query.cursorAfter(pageParam.toString()));
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries,
    );
    if (!posts) throw Error;
    return posts;
  } catch (error) {
    console.error(error);
  }
}

// like post
export async function likePost(postId: string, likesArray: string[]) {
  try {
    const likedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes: likesArray,
      },
    );
    if (!likedPost) throw Error;
    return likedPost;
  } catch (error) {
    console.error(error);
  }
}
// create save post
export async function savePost(userId: string, postId: string) {
  // console.log(userId,postId)
  try {
    const savedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.saveCollectionId,
      ID.unique(),
      {
        post: postId,
        user: userId,
      },
    );
    if (!savePost) throw Error;
    return savedPost;
  } catch (error) {
    console.error(error);
  }
}
// delete save post
export async function deleteSavePost(saveId: string) {
  // console.log(saveId)
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.saveCollectionId,
      saveId,
    );
    if (!statusCode) throw Error;
    return { status: "Ok" };
  } catch (error) {
    console.error(error);
  }
}
// upload file
export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file,
    );
    return uploadedFile;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// get url image
export async function getFilePreview(fileId: string) {
  try {
    const fileUrl = await storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      "top",
      100,
    );
    if (!fileUrl) throw Error;
    return fileUrl;
  } catch (error) {
    console.error(error);
  }
}
// delete file
export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);
    return { status: "ok" };
  } catch (error) {
    console.error(error);
  }
}

// get post by id
export async function getPostById(postId?: string) {
  if (!postId) throw Error;
  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
    );
    if (!post) throw Error;
    return post;
  } catch (error) {
    console.error(error);
  }
}
