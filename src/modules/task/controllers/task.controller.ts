import { ImageDto } from '@core/common/dto/image/image.dto';
import { IPaginate } from '@core/interfaces/paginate.interface';
import { LuxonDatePipe } from '@core/pipes/luxon-date.pipe';
import { convertFileToBase64 } from '@core/utils/multer/multer.utils';
import { SwaggerEnum } from '@enums/swagger.enums';
import { UserDecorator } from '@modules/auth/decorator/user/user.decorator';
import { AuthGuard } from '@modules/auth/guards/auth/auth.guard';
import { TaskPermissionsGuard } from '@modules/auth/guards/task-permissions/task-permissions.guard';
import { User } from '@modules/shared/database/shared/schemas/user.schema';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskService } from '../services/task.service';

@ApiTags('tasks')
@UseGuards(AuthGuard)
@UseGuards(TaskPermissionsGuard)
@ApiBearerAuth(SwaggerEnum.AUTH_TOKEN)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments', 10))
  @ApiBody({ type: CreateTaskDto })
  create(
    @UserDecorator() user: User,
    @Body(new LuxonDatePipe()) createTaskDto: CreateTaskDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const attachments = files?.map((file) => convertFileToBase64(file)) || [];
    return this.taskService.create(user, createTaskDto, attachments);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all tasks with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@UserDecorator() user: User, @Query() pagination: IPaginate) {
    return this.taskService.findAll(user, pagination);
  }

  @Get('get/:id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a task by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments', 10))
  @ApiBody({ type: UpdateTaskDto })
  update(
    @Param('id') id: string,
    @UserDecorator() user: User,
    @Body(new LuxonDatePipe()) updateTaskDto: UpdateTaskDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const attachments = files?.map((file) => convertFileToBase64(file)) || [];
    return this.taskService.update(user, id, updateTaskDto, attachments);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete a task by ID' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }
}
